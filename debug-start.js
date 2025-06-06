// ABOUTME: Debug startup script to identify initialization issues
// ABOUTME: Provides detailed logging for troubleshooting the refactored app

process.env.NODE_ENV = 'development';

console.log('[Debug] Starting application with debug logging...');

try {
  console.log('[Debug] Loading modules...');
  const windowManager = require('./src/main/window-manager');
  console.log('[Debug] WindowManager loaded');
  
  const ipcHandlers = require('./src/main/ipc-handlers');
  console.log('[Debug] IPC Handlers loaded');
  
  const spotifyAuth = require('./src/auth/spotify-auth');
  console.log('[Debug] Spotify Auth loaded');
  
  const authServer = require('./src/auth/auth-server');
  console.log('[Debug] Auth Server loaded');
  
  const cacheService = require('./src/services/cache-service');
  console.log('[Debug] Cache Service loaded');
  
  const CONSTANTS = require('./src/utils/constants');
  console.log('[Debug] Constants loaded');

  console.log('[Debug] All modules loaded successfully, starting main initialization...');
  
  function initializeApp() {
    console.log('[Debug] Setting up window created callback...');
    windowManager.setOnWindowCreatedCallback((mainWindow) => {
      console.log('[Debug] Window created callback triggered');
      spotifyAuth.setMainWindow(mainWindow);
      console.log('[Debug] Spotify auth window set');
      ipcHandlers.initialize();
      console.log('[Debug] IPC handlers initialized');
    });
    
    console.log('[Debug] Setting up app events...');
    windowManager.setupAppEvents();

    console.log('[Debug] Setting up cache cleanup interval...');
    setInterval(() => {
      console.log('[Debug] Running cache cleanup...');
      cacheService.cleanup();
    }, CONSTANTS.INTERVALS.CACHE_CLEANUP_MS);

    console.log('[Debug] Application initialized successfully');
  }

  function cleanupApp() {
    console.log('[Debug] Cleaning up application...');
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

} catch (error) {
  console.error('[Debug] Error during startup:', error);
  process.exit(1);
}