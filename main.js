// ABOUTME: Main process orchestrator for the Electron application
// ABOUTME: Coordinates all modules and initializes the application

console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
console.log('!!! MAIN.JS HAS LOADED - VERSION CHECK !!!');
console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

const windowManager = require('./src/main/window-manager');
const ipcHandlers = require('./src/main/ipc-handlers');
const spotifyAuth = require('./src/auth/spotify-auth');
const authServer = require('./src/auth/auth-server');
const cacheService = require('./src/services/cache-service');
const CONSTANTS = require('./src/utils/constants');

function initializeApp() {
  windowManager.setOnWindowCreatedCallback((mainWindow) => {
    spotifyAuth.setMainWindow(mainWindow);
    ipcHandlers.initialize();
    console.log('[Main] Window and IPC handlers initialized');
  });
  
  windowManager.setupAppEvents();

  setInterval(() => {
    cacheService.cleanup();
  }, CONSTANTS.INTERVALS.CACHE_CLEANUP_MS);

  console.log('[Main] Application initialized successfully');
}

function cleanupApp() {
  console.log('[Main] Cleaning up application...');
  authServer.close();
  spotifyAuth.cleanup();
  ipcHandlers.cleanup();
  cacheService.clear();
}

process.on('exit', cleanupApp);
process.on('SIGINT', () => {
  cleanupApp();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanupApp();
  process.exit(0);
});

initializeApp();