// ABOUTME: Electron window management and lifecycle
// ABOUTME: Handles BrowserWindow creation, events, and cleanup

const { app, BrowserWindow } = require('electron');
const path = require('path');
const CONSTANTS = require('../utils/constants');

class WindowManager {
  constructor() {
    this.mainWindow = null;
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: CONSTANTS.WINDOW.DEFAULT_WIDTH,
      height: CONSTANTS.WINDOW.DEFAULT_HEIGHT,
      webPreferences: {
        preload: path.join(__dirname, '../../preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.mainWindow.loadFile(path.join(__dirname, '../../index.html'));
    
    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  getMainWindow() {
    return this.mainWindow;
  }

  closeMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }

  setupAppEvents() {
    app.whenReady().then(() => {
      this.createMainWindow();
      this.onWindowCreated();
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
          this.onWindowCreated();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('will-quit', () => {
      console.log('[WindowManager] Application will quit');
    });
  }

  sendToRenderer(channel, ...args) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send(channel, ...args);
    }
  }

  onWindowCreated() {
    // Hook for initialization after window creation
    if (this.onWindowCreatedCallback) {
      this.onWindowCreatedCallback(this.mainWindow);
    }
  }

  setOnWindowCreatedCallback(callback) {
    this.onWindowCreatedCallback = callback;
  }
}

module.exports = new WindowManager();