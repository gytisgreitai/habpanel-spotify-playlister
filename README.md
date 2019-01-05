# Spotify Playlists for openHAB Habpanel
![](https://github.com/gytisgreitai/habpanel-spotify-playlister/raw/master/media/playlister.png)

- Shows your Spotify playlists (max 50)
- Allows searching for albums, tracks, artists, playlists
- Allows to play selected item on your configured player


## Requirements

- Spotify Binding for openHAB. Read [here](https://community.openhab.org/t/idea-for-binding-spotify-connect-binding/11290/52) or [here](https://marketplace.eclipse.org/content/spotify-binding-beta#bootstrap-panel--2)
- Configured items from binding:  `accessToken` and `devicePlayer`, eg:

```
Player Spotify_Squeezebox_Player "Spotify Squeezebox"        { channel="spotify:device:squeezebox:devicePlayer" }
String Spotify_Squeezebox_Play "Spotify Play on Squeezebox"  { channel="spotify:device:squeezebox:trackPlay" }
```


## Instalation
- Add `Spotify Playlister.json` to habpanel
- Place `release/spotify-playlister.js` file into openHAB html dir under `spotify-playlister` directory, eg:
```
$ cd /etc/openhab2/html/
$ mkdir spotify-playlister && cd "$_"
$ wget https://raw.githubusercontent.com/gytisgreitai/habpanel-spotify-playlister/master/release/spotify-playlister.js
```

- Configure widget selecting your Player and Access token items
- Select `Don't wrap in container` or else it will break the layout
