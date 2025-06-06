// ABOUTME: Spotify OAuth authentication management
// ABOUTME: Handles access token refresh and authentication state

const SpotifyWebApi = require('spotify-web-api-node');
const config = require('../utils/config-loader');
const cacheService = require('../services/cache-service');

class SpotifyAuth {
  constructor() {
    this.spotifyApi = null;
    this.userAccessToken = null;
    this.userRefreshToken = null;
    this.mainWindow = null;
    this.refreshInterval = null;
    this.initialize();
  }

  initialize() {
    const spotifyConfig = config.getAll();
    this.spotifyApi = new SpotifyWebApi({
      clientId: spotifyConfig.spotifyClientId,
      clientSecret: spotifyConfig.spotifyClientSecret,
      redirectUri: 'http://127.0.0.1:8888/callback'
    });
  }

  setMainWindow(window) {
    this.mainWindow = window;
  }

  getAuthorizeURL() {
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
      'user-read-email'
    ];
    return this.spotifyApi.createAuthorizeURL(userScopes, 'some-state-value');
  }

  async handleAuthCode(authCode) {
    try {
      const data = await this.spotifyApi.authorizationCodeGrant(authCode);
      this.userAccessToken = data.body['access_token'];
      this.userRefreshToken = data.body['refresh_token'];
      const expiresIn = data.body['expires_in'];

      this.spotifyApi.setAccessToken(this.userAccessToken);
      this.spotifyApi.setRefreshToken(this.userRefreshToken);

      console.log('User Access Token:', this.userAccessToken ? 'Received' : 'Not Received');
      console.log('User Refresh Token:', this.userRefreshToken ? 'Received' : 'Not Received');
      console.log('User Token expires in:', expiresIn, 'seconds');

      this.scheduleTokenRefresh(expiresIn);

      if (this.mainWindow) {
        this.mainWindow.webContents.send('spotify:auth-success');
      }

      return { success: true };
    } catch (error) {
      console.error('Error getting user tokens:', error);
      throw error;
    }
  }

  scheduleTokenRefresh(expiresIn) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.refreshInterval = setInterval(() => {
      this.refreshAccessToken();
    }, (expiresIn / 2) * 1000);
  }

  async refreshAccessToken() {
    if (!this.userRefreshToken) {
      console.log('No user refresh token available. User needs to re-authenticate.');
      if (this.mainWindow) {
        this.mainWindow.webContents.send('spotify:auth-required');
      }
      return;
    }

    try {
      const data = await this.spotifyApi.refreshAccessToken();
      this.userAccessToken = data.body['access_token'];
      this.spotifyApi.setAccessToken(this.userAccessToken);
      console.log('User access token has been refreshed.');
      
      const expiresIn = data.body['expires_in'];
      if (expiresIn) {
        console.log('New user token expires in:', expiresIn, 'seconds');
        this.scheduleTokenRefresh(expiresIn);
      } else {
        setTimeout(() => this.refreshAccessToken(), (60 * 30) * 1000);
      }
    } catch (error) {
      console.error('Could not refresh user access token', error);
      // Clear last played when auth fails
      cacheService.delete('lastPlayed', 'current');
      if (this.mainWindow) {
        this.mainWindow.webContents.send('spotify:auth-required');
      }
    }
  }

  isAuthenticated() {
    return !!this.userAccessToken;
  }

  getAccessToken() {
    return this.userAccessToken;
  }

  getSpotifyApi() {
    return this.spotifyApi;
  }

  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    // Clear last played track when logging out
    cacheService.delete('lastPlayed', 'current');
    console.log('[SpotifyAuth] Cleared last played track cache');
  }
}

module.exports = new SpotifyAuth();