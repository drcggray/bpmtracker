// main.js - Main process for the Electron application
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('!!! MAIN.JS HAS LOADED - VERSION CHECK !!!');
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

    const { app, BrowserWindow, ipcMain, shell } = require('electron');
    const path = require('path');
    const http = require('http');
    const https = require('https'); 
    const url = require('url');
    const SpotifyWebApi = require('spotify-web-api-node');

    // --- GetSongBPM API Configuration ---
    // !!! IMPORTANT: Store this securely, not hardcoded in production! We'll address this. !!!
    const YOUR_GETSONGBPM_API_KEY = '2432d130cdb147058971604700f83e4e';

    // --- Spotify API Configuration ---
    const SPOTIFY_CLIENT_ID = 'a8d0a630a81848498ca99a4e50b31150'; 
    const SPOTIFY_CLIENT_SECRET = '79d7870f33414259999a0dc8df3f3c35'; // !!! George's actual secret is in his file !!!
    const SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:8888/callback';

    const userScopes = [ 
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-read-private',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-follow-read',
      'user-library-read',
      'user-top-read',
      'user-read-recently-played',
      'user-read-email' // Added user-read-email scope
    ];

    const spotifyUserApi = new SpotifyWebApi({ 
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      redirectUri: SPOTIFY_REDIRECT_URI,
    });

    let userAccessToken = null; 
    let userRefreshToken = null; 
    
    let mainWindow = null;
    let server;

    // --- GetSongBPM API Call Function ---
    async function fetchBpmFromGetSongBpm(trackName, artistName) {
      if (!trackName || !artistName) {
        console.warn('[GetSongBPM] Missing trackName or artistName');
        return { error: 'Missing track or artist name for BPM lookup' };
      }
      if (!YOUR_GETSONGBPM_API_KEY) {
        console.error('[GetSongBPM] API Key is missing!');
        return { error: 'GetSongBPM API Key is not configured' };
      }

      const lookupQuery = `song:${encodeURIComponent(trackName)} artist:${encodeURIComponent(artistName)}`;
      const apiUrl = `https://api.getsong.co/search/?api_key=${YOUR_GETSONGBPM_API_KEY}&type=song&limit=1&lookup=${lookupQuery}`;
      
      console.log(`[GetSongBPM] Fetching BPM for: ${trackName} - ${artistName}`);
      // console.log(`[GetSongBPM] API URL: ${apiUrl}`); // For debugging, can be noisy

      return new Promise((resolve) => {
        const options = {
          hostname: 'api.getsong.co',
          path: `/search/?api_key=${YOUR_GETSONGBPM_API_KEY}&type=song&limit=1&lookup=${lookupQuery}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SpotifyBPMViewer/1.0' // Good practice to set a User-Agent
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              if (res.statusCode === 200) {
                const parsedData = JSON.parse(data);
                if (parsedData.search && parsedData.search.length > 0 && parsedData.search[0].tempo) {
                  const bpm = Math.round(parseFloat(parsedData.search[0].tempo));
                  console.log(`[GetSongBPM] Success: Found BPM ${bpm} for ${trackName}`);
                  resolve({ bpm });
                } else {
                  console.warn(`[GetSongBPM] BPM not found in response for ${trackName}:`, parsedData.search);
                  resolve({ error: 'BPM not found in GetSongBPM response' });
                }
              } else {
                console.error(`[GetSongBPM] Error: Status ${res.statusCode}`, data);
                resolve({ error: { message: `GetSongBPM API error: ${res.statusCode}`, details: data, statusCode: res.statusCode } });
              }
            } catch (e) {
              console.error('[GetSongBPM] Error parsing JSON:', e, "Raw data:", data);
              resolve({ error: { message: 'Failed to parse response from GetSongBPM', details: e.message } });
            }
          });
        });
        req.on('error', (e) => {
          console.error('[GetSongBPM] Request error:', e);
          resolve({ error: { message: `Request failed for GetSongBPM: ${e.message}`, details: e.toString() } });
        });
        req.end();
      });
    }
    
    // --- Custom Spotify API Call Functions ---
    async function fetchSpotifyQueueDirectly() {
      if (!userAccessToken) {
        return Promise.resolve({ error: 'Not authenticated for direct queue fetch (user token)' });
      }
      return new Promise((resolve) => {
        const options = {
          hostname: 'api.spotify.com',
          path: '/v1/me/player/queue',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userAccessToken}`,
            'Content-Type': 'application/json'
          }
        };
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              if (res.statusCode === 200) {
                const parsedData = JSON.parse(data);
                resolve(parsedData);
              } else {
                console.error(`Error fetching queue directly: Status ${res.statusCode}`, data);
                resolve({ error: { message: `Spotify API error for queue: ${res.statusCode}`, details: data, statusCode: res.statusCode } });
              }
            } catch (e) {
              console.error('Error parsing queue JSON:', e);
              resolve({ error: { message: 'Failed to parse queue response from Spotify', details: e.message } });
            }
          });
        });
        req.on('error', (e) => {
          console.error('Error with direct queue request:', e);
          resolve({ error: { message: `Request failed for queue: ${e.message}`, details: e.toString() } });
        });
        req.end();
      });
    }

    async function fetchCurrentlyPlayingDirectly() {
      if (!userAccessToken) {
        return Promise.resolve({ error: 'Not authenticated for direct currently playing fetch (user token)' });
      }
      return new Promise((resolve) => {
        const options = {
          hostname: 'api.spotify.com',
          path: '/v1/me/player', 
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userAccessToken}`,
            'Content-Type': 'application/json'
          }
        };
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              if (res.statusCode === 200) {
                const parsedData = JSON.parse(data);
                resolve(parsedData); 
              } else if (res.statusCode === 204) { 
                console.log('[DEBUG] fetchCurrentlyPlayingDirectly received 204 No Content.');
                resolve({ item: null, is_playing: false }); 
              } else {
                console.error(`Error fetching currently playing directly: Status ${res.statusCode}`, data);
                resolve({ error: { message: `Spotify API error for currently playing: ${res.statusCode}`, details: data, statusCode: res.statusCode } });
              }
            } catch (e) {
              console.error('Error parsing currently playing JSON:', e);
              resolve({ error: { message: 'Failed to parse currently playing response from Spotify', details: e.message } });
            }
          });
        });
        req.on('error', (e) => {
          console.error('Error with direct currently playing request:', e);
          resolve({ error: { message: `Request failed for currently playing: ${e.message}`, details: e.toString() } });
        });
        req.end();
      });
    }

    // Using spotifyUserApi for this as a test, though direct call also got 403.
    // If this also fails, it confirms the 403 is persistent for the token/endpoint.
    async function getAudioFeaturesWithLibrary(trackId) {
        if (!userAccessToken || !trackId) {
            return { error: 'Missing token or trackId for library audio features call' };
        }
        try {
            console.log(`[DEBUG] Attempting library call getAudioFeaturesForTrack for ID: ${trackId}`);
            const audioFeaturesData = await spotifyUserApi.getAudioFeaturesForTrack(trackId);
            if (audioFeaturesData && audioFeaturesData.body && audioFeaturesData.body.tempo) {
                return { bpm: Math.round(audioFeaturesData.body.tempo) };
            } else {
                console.error(`Failed to get tempo from library call for track ${trackId}:`, audioFeaturesData ? audioFeaturesData.body : 'No body');
                return { error: 'Could not extract tempo from library response', details: audioFeaturesData.body };
            }
        } catch (error) {
            console.error(`Error in getAudioFeaturesWithLibrary for track ${trackId}:`, error);
            return { error: `Library call for audio features failed: ${error.message}`, statusCode: error.statusCode };
        }
    }

    // --- HTTP Server for Spotify OAuth Callback ---
    function startAuthServer(resolvePromise, rejectPromise) {
      server = http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url, true);
        if (parsedUrl.pathname === '/callback') {
          const authCode = parsedUrl.query.code;
          const error = parsedUrl.query.error;

          if (error) {
            console.error('Spotify Authentication Error:', error);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Authentication Failed</h1><p>You can close this window.</p>');
            if (rejectPromise) rejectPromise(new Error('Spotify authentication failed: ' + error));
            return;
          }

          if (authCode) {
            try {
              const data = await spotifyUserApi.authorizationCodeGrant(authCode); 
              userAccessToken = data.body['access_token'];
              userRefreshToken = data.body['refresh_token'];
              const expiresIn = data.body['expires_in'];

              spotifyUserApi.setAccessToken(userAccessToken); 
              spotifyUserApi.setRefreshToken(userRefreshToken);

              console.log('User Access Token:', userAccessToken ? 'Received' : 'Not Received');
              console.log('User Refresh Token:', userRefreshToken ? 'Received' : 'Not Received');
              console.log('User Token expires in:', expiresIn, 'seconds');

              setInterval(refreshUserAccessToken, (expiresIn / 2) * 1000); 

              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end('<h1>Authentication Successful!</h1><p>You can close this window and return to the app.</p>');
              
              if (mainWindow) {
                mainWindow.webContents.send('spotify:auth-success');
              }
              if (resolvePromise) resolvePromise();

            } catch (err) {
              console.error('Error getting user tokens:', err);
              res.writeHead(500, { 'Content-Type': 'text/html' });
              res.end('<h1>Error getting user tokens</h1><p>Please try again.</p>');
              if (rejectPromise) rejectPromise(err);
            } finally {
              if (server) server.close(() => { console.log('Auth callback server closed.'); });
            }
          }
        } else {
          res.writeHead(404);
          res.end();
        }
      }).listen(8888, '127.0.0.1', () => {
        console.log('Temporary server for Spotify auth callback listening on http://127.0.0.1:8888');
      });
      server.on('error', (err) => {
        console.error("Auth server error:", err);
        if (rejectPromise) rejectPromise(err);
      });
    }

    async function refreshUserAccessToken() { 
      if (!userRefreshToken) {
        console.log('No user refresh token available. User needs to re-authenticate.');
        if (mainWindow) mainWindow.webContents.send('spotify:auth-required');
        return;
      }
      try {
        const data = await spotifyUserApi.refreshAccessToken(); 
        userAccessToken = data.body['access_token'];
        spotifyUserApi.setAccessToken(userAccessToken); 
        console.log('User access token has been refreshed.');
        const expiresIn = data.body['expires_in'];
        if (expiresIn) {
            console.log('New user token expires in:', expiresIn, 'seconds');
            setTimeout(refreshUserAccessToken, (expiresIn / 2) * 1000);
        } else {
            setTimeout(refreshUserAccessToken, (60 * 30) * 1000); 
        }
      } catch (error) {
        console.error('Could not refresh user access token', error);
        if (mainWindow) mainWindow.webContents.send('spotify:auth-required');
      }
    }

    // --- Electron Window Creation ---
    function createWindow() {
      mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
        },
      });
      mainWindow.loadFile('index.html');
      mainWindow.on('closed', () => {
        mainWindow = null;
        if (server && server.listening) {
            server.close(() => { console.log('Auth callback server closed on app quit.'); });
        }
      });
    }

    app.whenReady().then(async () => { 
      createWindow();
      app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
      });
    });

    app.on('window-all-closed', function () {
      if (process.platform !== 'darwin') app.quit();
    });

    app.on('will-quit', () => {
        if (server && server.listening) {
            server.close(() => { console.log('Auth callback server closed on will-quit.'); });
        }
    });

    // --- IPC Handlers ---
    ipcMain.handle('spotify:get-auth-url', async () => {
      const authorizeURL = spotifyUserApi.createAuthorizeURL(userScopes, 'some-state-value'); 
      console.log('Generated Auth URL:', authorizeURL);
      return authorizeURL;
    });

    ipcMain.handle('spotify:start-auth-flow', async () => {
      return new Promise((resolve, reject) => {
        if (server && server.listening) {
          console.log("Auth server already running. Closing existing one.");
          server.close(() => {
            startAuthServer(resolve, reject);
          });
        } else {
          startAuthServer(resolve, reject);
        }
        const authorizeURL = spotifyUserApi.createAuthorizeURL(userScopes, 'some-state-value'); 
        shell.openExternal(authorizeURL);
      });
    });

    ipcMain.handle('spotify:get-currently-playing', async () => {
      if (!userAccessToken) return { error: 'Not authenticated' }; 
      try {
        const playbackState = await fetchCurrentlyPlayingDirectly(); 

        if (playbackState && playbackState.error) {
          console.error('Error from fetchCurrentlyPlayingDirectly:', playbackState.error);
          throw new Error(playbackState.error.details || playbackState.error.error || playbackState.error.message);
        }
        
        if (!playbackState || !playbackState.item) { 
            console.log('[DEBUG] No item currently playing or playbackState is null/undefined (received from fetchCurrentlyPlayingDirectly).');
            const result = { name: 'Nothing playing or private session.', artist: '', bpm: 'N/A', albumArt: null };
            console.log('[DEBUG] spotify:get-currently-playing NOTHING PLAYING, returning:', JSON.stringify(result, null, 2));
            return result;
        }

        if (playbackState.is_playing && playbackState.item) { 
          const track = playbackState.item;
          const trackName = track.name;
          const mainArtistName = track.artists && track.artists.length > 0 ? track.artists[0].name : 'Unknown Artist';
          
          let bpm = 'N/A';
          // Fetch BPM from GetSongBPM.com
          const bpmResult = await fetchBpmFromGetSongBpm(trackName, mainArtistName);
          if (bpmResult && bpmResult.bpm) {
            bpm = bpmResult.bpm;
          } else if (bpmResult && bpmResult.error) {
            console.warn(`[GetSongBPM] Failed to get BPM for current track "${trackName}":`, bpmResult.error.message || bpmResult.error);
          } else {
            console.warn(`[GetSongBPM] No BPM data returned for current track "${trackName}"`);
          }

          const result = {
            name: trackName,
            artist: track.artists.map(artist => artist.name).join(', '),
            bpm: bpm, 
            albumArt: track.album && track.album.images && track.album.images.length > 0 ? track.album.images[0].url : null,
            trackIdForBpm: track.id // Keep for potential future use, though not used for BPM now
          };
          console.log('[DEBUG] spotify:get-currently-playing SUCCESS, returning:', JSON.stringify(result, null, 2));
          return result;
        }
        
        const defaultNothingPlayingResult = { name: 'Nothing actively playing.', artist: '', bpm: 'N/A', albumArt: null };
        console.log('[DEBUG] spotify:get-currently-playing UNHANDLED STATE or NOT IS_PLAYING, returning:', JSON.stringify(defaultNothingPlayingResult, null, 2), 'PlaybackState:', JSON.stringify(playbackState, null, 2));
        return defaultNothingPlayingResult;

      } catch (error) { 
        console.error('Error in spotify:get-currently-playing handler:', error);
        const errorResult = { error: `Failed to fetch currently playing song: ${error.message}`, bpm: 'N/A' };
        console.log('[DEBUG] spotify:get-currently-playing ERROR, returning:', JSON.stringify(errorResult, null, 2));
        const statusCode = error.statusCode || (error.cause && error.cause.statusCode); 
        if (statusCode === 401 || (error.message && error.message.includes('401'))) {
            if (mainWindow) mainWindow.webContents.send('spotify:auth-required');
        }
        return errorResult; 
      }
    });

    ipcMain.handle('spotify:get-queue', async () => {
      if (!userAccessToken) return { error: 'Not authenticated' }; 
      try {
        const queueApiResponse = await fetchSpotifyQueueDirectly();
        console.log('[DEBUG] Raw response from fetchSpotifyQueueDirectly:', JSON.stringify(queueApiResponse, null, 2));

        if (queueApiResponse && queueApiResponse.error) {
          console.error('Error returned from fetchSpotifyQueueDirectly:', queueApiResponse.error);
          return { error: `Direct queue fetch failed: ${queueApiResponse.error.details || queueApiResponse.error.error || queueApiResponse.error.message}` };
        }

        if (queueApiResponse && queueApiResponse.queue && queueApiResponse.queue.length > 0) {
          const nextTrackRaw = queueApiResponse.queue[0];
          if (nextTrackRaw.type === 'track') {
            const trackName = nextTrackRaw.name;
            const mainArtistName = nextTrackRaw.artists && nextTrackRaw.artists.length > 0 ? nextTrackRaw.artists[0].name : 'Unknown Artist';

            let bpm = 'N/A';
            // Fetch BPM from GetSongBPM.com
            const bpmResult = await fetchBpmFromGetSongBpm(trackName, mainArtistName);
            if (bpmResult && bpmResult.bpm) {
              bpm = bpmResult.bpm;
            } else if (bpmResult && bpmResult.error) {
              console.warn(`[GetSongBPM] Failed to get BPM for next track "${trackName}":`, bpmResult.error.message || bpmResult.error);
            } else {
              console.warn(`[GetSongBPM] No BPM data returned for next track "${trackName}"`);
            }
            
            return {
              name: trackName,
              artist: nextTrackRaw.artists.map(artist => artist.name).join(', '),
              bpm: bpm, 
              albumArt: nextTrackRaw.album && nextTrackRaw.album.images && nextTrackRaw.album.images.length > 0 ? nextTrackRaw.album.images[0].url : null,
              trackIdForBpm: nextTrackRaw.id, // Keep for potential future use
            };
          }
        } else if (queueApiResponse && queueApiResponse.currently_playing && (!queueApiResponse.queue || queueApiResponse.queue.length === 0)) {
          return { name: 'End of queue.', artist: '', bpm: 'N/A', albumArt: null };
        }
        return { name: 'Queue is empty or unavailable (direct fetch).', artist: '', bpm: 'N/A', albumArt: null };

      } catch (error) {
        console.error('Critical error in spotify:get-queue handler:', error);
        const statusCode = error.statusCode || (error.cause && error.cause.statusCode);
        if (statusCode === 401 || (error.message && error.message.includes('401'))) {
            if (mainWindow) mainWindow.webContents.send('spotify:auth-required');
        }
        return { error: `Unexpected error in get-queue handler: ${error.message}`, bpm: 'N/A' };
      }
    });
