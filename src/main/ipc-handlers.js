// ABOUTME: IPC communication handlers for main-renderer bridge
// ABOUTME: Manages all inter-process communication between main and renderer processes

const { ipcMain, shell } = require('electron');
const spotifyAuth = require('../auth/spotify-auth');
const authServer = require('../auth/auth-server');
const trackService = require('../services/track-service');
const windowManager = require('./window-manager');

class IpcHandlers {
  constructor() {
    this.registerHandlers();
  }

  registerHandlers() {
    ipcMain.handle('spotify:get-auth-url', this.handleGetAuthUrl.bind(this));
    ipcMain.handle('spotify:start-auth-flow', this.handleStartAuthFlow.bind(this));
    ipcMain.handle('spotify:get-currently-playing', this.handleGetCurrentlyPlaying.bind(this));
    ipcMain.handle('spotify:get-queue', this.handleGetQueue.bind(this));
    ipcMain.handle('spotify:get-lyrics', this.handleGetLyrics.bind(this));
  }

  async handleGetAuthUrl() {
    const authorizeURL = spotifyAuth.getAuthorizeURL();
    console.log('Generated Auth URL:', authorizeURL);
    return authorizeURL;
  }

  async handleStartAuthFlow() {
    return new Promise((resolve, reject) => {
      if (authServer.isRunning()) {
        console.log("Auth server already running. Closing existing one.");
        authServer.close();
      }

      authServer.start(
        async (authCode) => {
          try {
            await spotifyAuth.handleAuthCode(authCode);
            trackService.setAccessToken(spotifyAuth.getAccessToken());
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        reject
      );

      const authorizeURL = spotifyAuth.getAuthorizeURL();
      shell.openExternal(authorizeURL);
    });
  }

  async handleGetCurrentlyPlaying() {
    if (!spotifyAuth.isAuthenticated()) {
      return { error: 'Not authenticated' };
    }

    try {
      trackService.setAccessToken(spotifyAuth.getAccessToken());
      const result = await trackService.getCurrentlyPlaying();
      
      if (result.error && this.isAuthError(result.error)) {
        windowManager.sendToRenderer('spotify:auth-required');
      }
      
      return result;
    } catch (error) {
      console.error('Error in handleGetCurrentlyPlaying:', error);
      if (this.isAuthError(error)) {
        windowManager.sendToRenderer('spotify:auth-required');
      }
      return { error: `Failed to fetch currently playing song: ${error.message}`, bpm: 'N/A' };
    }
  }

  async handleGetQueue() {
    if (!spotifyAuth.isAuthenticated()) {
      return { error: 'Not authenticated' };
    }

    try {
      trackService.setAccessToken(spotifyAuth.getAccessToken());
      const result = await trackService.getQueue();
      
      if (result.error && this.isAuthError(result.error)) {
        windowManager.sendToRenderer('spotify:auth-required');
      }
      
      return result;
    } catch (error) {
      console.error('Error in handleGetQueue:', error);
      if (this.isAuthError(error)) {
        windowManager.sendToRenderer('spotify:auth-required');
      }
      return { error: `Unexpected error in get-queue handler: ${error.message}`, bpm: 'N/A' };
    }
  }

  async handleGetLyrics(event, trackName, artistName) {
    if (!spotifyAuth.isAuthenticated()) {
      return { error: 'Not authenticated' };
    }

    if (!trackName || !artistName) {
      return { error: 'Missing track or artist name' };
    }

    try {
      console.log(`[IPC] Requesting lyrics for "${trackName}" by "${artistName}"`);
      trackService.setAccessToken(spotifyAuth.getAccessToken());
      const result = await trackService.getLyrics(trackName, artistName);
      return result;
    } catch (error) {
      console.error('Error in handleGetLyrics:', error);
      return { error: `Failed to fetch lyrics: ${error.message}` };
    }
  }

  isAuthError(error) {
    if (typeof error === 'string') {
      return error.includes('401');
    }
    if (error && error.statusCode) {
      return error.statusCode === 401;
    }
    if (error && error.message) {
      return error.message.includes('401');
    }
    return false;
  }

  initialize() {
    const mainWindow = windowManager.getMainWindow();
    spotifyAuth.setMainWindow(mainWindow);
    console.log('[IPC] Handlers registered and initialized', mainWindow ? 'with window' : 'without window');
  }

  cleanup() {
    ipcMain.removeAllListeners('spotify:get-auth-url');
    ipcMain.removeAllListeners('spotify:start-auth-flow');
    ipcMain.removeAllListeners('spotify:get-currently-playing');
    ipcMain.removeAllListeners('spotify:get-queue');
    ipcMain.removeAllListeners('spotify:get-lyrics');
    console.log('[IPC] Handlers cleaned up');
  }
}

module.exports = new IpcHandlers();