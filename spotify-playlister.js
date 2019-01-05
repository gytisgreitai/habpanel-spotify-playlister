angular
.module('app.widgets')
.service('spotifyPlaylisterService', SpotifyPlaylisterService)
.controller('SpotifyPlaylisterController', SpotifyPlaylisterController)

SpotifyPlaylisterController.$inject = ['$scope', '$timeout', 'OHService', 'spotifyPlaylisterService'];


function SpotifyPlaylisterController($scope, $timeout, OHService, spotifyPlaylisterService) {
  const ctrl = this;

  const initController = () =>{
    ctrl.state = {
      noConfig: !$scope.config || !$scope.config.accessToken,
      accessToken: null,
      userId: null,
      results: null,
      query: null,
      error: false
    }

    ctrl.model = {
      query: ''
    }
  
  }

  initController()

  const loadPlaylists = () => {
    ctrl.state.error = false;
    const { userId, accessToken } = ctrl.state;
    spotifyPlaylisterService.getUserPlaylists(accessToken, userId).then(playlists => {
      ctrl.state.results = [{name: 'Your Playlists', items: playlists}]
    }).catch(() => ctrl.state.error = true)
  }

  const init = (accessTokenItemName) => {
    const accessTokenItem = OHService.getItem(accessTokenItemName);
    if (!accessTokenItem || !accessTokenItem.state) {
      return
    }
    if (ctrl.state.accessToken !== accessTokenItem.state) {
      ctrl.state.accessToken = accessTokenItem.state
      
      spotifyPlaylisterService.getUserId(ctrl.state.accessToken).then(userId => {
        ctrl.state.userId = userId;
        loadPlaylists()
      }).catch(() => ctrl.state.error = true)
    }
  }

  ctrl.reset = () => {
    initController()
    if ($scope.config && $scope.config.accessToken) {
      init($scope.config.accessToken);
    }
  }

  ctrl.play = (item) => {
    OHService.sendCmd($scope.config.spotifyPlayer, item.uri);
  }

  ctrl.search = () => {
    ctrl.state.query = ctrl.model.query;
    ctrl.state.error = false;
    ctrl.state.results = null;
    const { accessToken, query } = ctrl.state;
    if (query === '') {
      loadPlaylists()
    } else {
      spotifyPlaylisterService.search(accessToken, query).then(results => {
        ctrl.state.results = [
          {name: 'Albums', ...results.albums},
          {name: 'Playlists', ...results.playlists},
          {name: 'Tracks', ...results.tracks},
          {name: 'Artists', ...results.artists},
        ]
      }).catch(() => ctrl.state.error = true)
    }
  }

  $scope.$watch('config.accessToken', (accessTokenItemName) => {
    if (accessTokenItemName) {
      ctrl.state.noConfig = false;
      const accessTokenItem = OHService.getItem(accessTokenItemName);
      if (accessTokenItem && accessTokenItem.state) {
        init(accessTokenItemName);
      } else {
        //XXX: needed when habpanel loaded with refresh. should be a better way
        $timeout(() => {
          init(accessTokenItemName);
        }, 5000)
      }
    }
  });
}

SpotifyPlaylisterService.$inject = ['$http', '$cacheFactory'];
function SpotifyPlaylisterService($http, $cacheFactory) {
  
  const cache = $cacheFactory('spotify-playlister');
  
  const baseHeaders = (accessToken) => {
    return {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken
    }
  }

  const enqueueCacheRemove = (key) => {
    setTimeout(() => {
      cache.remove(key)
    }, 10000)
  }

  const doGet = (url, accessToken) => {
    enqueueCacheRemove(url);
    return $http({
      method: 'GET',
      url,
      headers: baseHeaders(accessToken),
    })
  }
  return {
    getUserId: function(accessToken) {
      const url = 'https://api.spotify.com/v1/me';
      return doGet(url, accessToken).then(({data}) => data.id)
    },
    getUserPlaylists: function(accessToken, userId) {
      const url = `https://api.spotify.com/v1/users/${userId}/playlists?limit=50&offset=0`;
      return doGet(url, accessToken).then(({data}) => data.items)
    },
    search: function(accessToken, query) {
      const url = `https://api.spotify.com/v1/search?type=album,artist,playlist,track&q=${encodeURIComponent(query)}&limit=15`
      return doGet(url, accessToken).then(({data}) => data)
    } 
  }
}