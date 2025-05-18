// preload.js - Exposes specific IPC channels to the renderer process.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('spotify', {
  // Ask main process to start the authentication flow
  startAuthFlow: () => ipcRenderer.invoke('spotify:start-auth-flow'),

  // Listen for authentication success message from main process
  onAuthSuccess: (callback) => ipcRenderer.on('spotify:auth-success', (_event) => callback()),
  
  // Listen for when authentication is required (e.g. token expired)
  onAuthRequired: (callback) => ipcRenderer.on('spotify:auth-required', (_event) => callback()),

  // Ask main process to get currently playing song data
  getCurrentlyPlaying: () => ipcRenderer.invoke('spotify:get-currently-playing'),

  // Ask main process to get queue data
  getQueue: () => ipcRenderer.invoke('spotify:get-queue'),
  
  // It's good practice to provide a way to remove listeners if the component using them is unmounted
  // For simplicity in this app, we might not need it if listeners are set up once.
  // removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

console.log('preload.js has been updated and loaded with Spotify API bridges.');
