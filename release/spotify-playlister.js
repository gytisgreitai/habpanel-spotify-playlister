"use strict";

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

angular.module('app.widgets').service('spotifyPlaylisterService', SpotifyPlaylisterService).controller('SpotifyPlaylisterController', SpotifyPlaylisterController);
SpotifyPlaylisterController.$inject = ['$scope', '$timeout', 'OHService', 'spotifyPlaylisterService'];

function SpotifyPlaylisterController($scope, $timeout, OHService, spotifyPlaylisterService) {
  var ctrl = this;

  var initController = function initController() {
    ctrl.state = {
      noConfig: !$scope.config || !$scope.config.accessToken,
      accessToken: null,
      userId: null,
      results: null,
      query: null,
      error: false
    };
    ctrl.model = {
      query: ''
    };
  };

  initController();

  var loadPlaylists = function loadPlaylists() {
    ctrl.state.error = false;
    var _ctrl$state = ctrl.state,
        userId = _ctrl$state.userId,
        accessToken = _ctrl$state.accessToken;
    spotifyPlaylisterService.getUserPlaylists(accessToken, userId).then(function (playlists) {
      ctrl.state.results = [{
        name: 'Your Playlists',
        items: playlists
      }];
    }).catch(function () {
      return ctrl.state.error = true;
    });
  };

  var init = function init(accessTokenItemName) {
    var accessTokenItem = OHService.getItem(accessTokenItemName);

    if (!accessTokenItem || !accessTokenItem.state) {
      return;
    }

    if (ctrl.state.accessToken !== accessTokenItem.state) {
      ctrl.state.accessToken = accessTokenItem.state;
      spotifyPlaylisterService.getUserId(ctrl.state.accessToken).then(function (userId) {
        ctrl.state.userId = userId;
        loadPlaylists();
      }).catch(function () {
        return ctrl.state.error = true;
      });
    }
  };

  ctrl.reset = function () {
    initController();

    if ($scope.config && $scope.config.accessToken) {
      init($scope.config.accessToken);
    }
  };

  ctrl.play = function (item) {
    OHService.sendCmd($scope.config.spotifyPlayer, item.uri);
  };

  ctrl.search = function () {
    ctrl.state.query = ctrl.model.query;
    ctrl.state.error = false;
    ctrl.state.results = null;
    var _ctrl$state2 = ctrl.state,
        accessToken = _ctrl$state2.accessToken,
        query = _ctrl$state2.query;

    if (query === '') {
      loadPlaylists();
    } else {
      spotifyPlaylisterService.search(accessToken, query).then(function (results) {
        ctrl.state.results = [_objectSpread({
          name: 'Albums'
        }, results.albums), _objectSpread({
          name: 'Playlists'
        }, results.playlists), _objectSpread({
          name: 'Tracks'
        }, results.tracks), _objectSpread({
          name: 'Artists'
        }, results.artists)];
      }).catch(function () {
        return ctrl.state.error = true;
      });
    }
  };

  $scope.$watch('config.accessToken', function (accessTokenItemName) {
    if (accessTokenItemName) {
      ctrl.state.noConfig = false;
      var accessTokenItem = OHService.getItem(accessTokenItemName);

      if (accessTokenItem && accessTokenItem.state) {
        init(accessTokenItemName);
      } else {
        //XXX: needed when habpanel loaded with refresh. should be a better way
        $timeout(function () {
          init(accessTokenItemName);
        }, 5000);
      }
    }
  });
}

SpotifyPlaylisterService.$inject = ['$http', '$cacheFactory'];

function SpotifyPlaylisterService($http, $cacheFactory) {
  var cache = $cacheFactory('spotify-playlister');

  var baseHeaders = function baseHeaders(accessToken) {
    return {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken
    };
  };

  var enqueueCacheRemove = function enqueueCacheRemove(key) {
    setTimeout(function () {
      cache.remove(key);
    }, 10000);
  };

  var doGet = function doGet(url, accessToken) {
    enqueueCacheRemove(url);
    return $http({
      method: 'GET',
      url: url,
      headers: baseHeaders(accessToken)
    });
  };

  return {
    getUserId: function getUserId(accessToken) {
      var url = 'https://api.spotify.com/v1/me';
      return doGet(url, accessToken).then(function (_ref) {
        var data = _ref.data;
        return data.id;
      });
    },
    getUserPlaylists: function getUserPlaylists(accessToken, userId) {
      var url = "https://api.spotify.com/v1/users/".concat(userId, "/playlists?limit=50&offset=0");
      return doGet(url, accessToken).then(function (_ref2) {
        var data = _ref2.data;
        return data.items;
      });
    },
    search: function search(accessToken, query) {
      var url = "https://api.spotify.com/v1/search?type=album,artist,playlist,track&q=".concat(encodeURIComponent(query), "&limit=15");
      return doGet(url, accessToken).then(function (_ref3) {
        var data = _ref3.data;
        return data;
      });
    }
  };
}