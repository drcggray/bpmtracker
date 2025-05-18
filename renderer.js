// renderer.js - Handles the logic for the Spotify BPM Viewer's interface

console.log('renderer.js loaded, now with IPC capabilities.');

// DOM Elements
const loginButton = document.getElementById('login-button');
const currentSongInfoDiv = document.getElementById('current-song-info');
const nextSongInfoDiv = document.getElementById('next-song-info');

const currentSongNameEl = document.getElementById('current-song-name');
const currentSongArtistEl = document.getElementById('current-song-artist');
const currentSongBpmEl = document.getElementById('current-song-bpm');
// Let's add an element for album art for the current song
const currentSongArtEl = document.createElement('img');
currentSongArtEl.id = 'current-song-art';
currentSongArtEl.style.maxWidth = '100px'; // Basic styling
currentSongArtEl.style.maxHeight = '100px';
currentSongArtEl.style.marginTop = '10px';
currentSongInfoDiv.appendChild(currentSongArtEl); // Add it to the div

const nextSongNameEl = document.getElementById('next-song-name');
const nextSongArtistEl = document.getElementById('next-song-artist');
const nextSongBpmEl = document.getElementById('next-song-bpm');
// And for the next song's album art
const nextSongArtEl = document.createElement('img');
nextSongArtEl.id = 'next-song-art';
nextSongArtEl.style.maxWidth = '80px';
nextSongArtEl.style.maxHeight = '80px';
nextSongArtEl.style.marginTop = '8px';
nextSongInfoDiv.appendChild(nextSongArtEl);

let isAuthenticated = false;
let dataFetchInterval = null;

function showLoginView() {
  loginButton.style.display = 'block';
  currentSongInfoDiv.style.display = 'none';
  nextSongInfoDiv.style.display = 'none';
  isAuthenticated = false;
  if (dataFetchInterval) {
    clearInterval(dataFetchInterval);
    dataFetchInterval = null;
  }
}

function showDataView() {
  loginButton.style.display = 'none';
  currentSongInfoDiv.style.display = 'block';
  nextSongInfoDiv.style.display = 'block';
  isAuthenticated = true;
  fetchAllSongData(); // Initial fetch
  if (!dataFetchInterval) {
    dataFetchInterval = setInterval(fetchAllSongData, 5000); // Poll every 5 seconds
  }
}

async function fetchCurrentlyPlaying() {
  if (!isAuthenticated) return;
  console.log('Renderer: Requesting currently playing song...');
  try {
    const data = await window.spotify.getCurrentlyPlaying();
    console.log('[DEBUG] Renderer received for current song:', JSON.stringify(data, null, 2)); // Added log
    if (data && !data.error) {
      currentSongNameEl.textContent = data.name || '--';
      currentSongArtistEl.textContent = data.artist || '--';
      currentSongBpmEl.textContent = data.bpm ? `${data.bpm} BPM` : '--';
      currentSongArtEl.src = data.albumArt || '';
      currentSongArtEl.style.display = data.albumArt ? 'block' : 'none';
    } else {
      console.error('Error fetching current song from main:', data ? data.error : 'Unknown error');
      currentSongNameEl.textContent = data && data.name ? data.name : 'Error or nothing playing'; // Display 'Nothing playing' if applicable
      currentSongArtistEl.textContent = '--';
      currentSongBpmEl.textContent = '--';
      currentSongArtEl.src = '';
      currentSongArtEl.style.display = 'none';
      if (data && data.error === 'Not authenticated') showLoginView();
    }
  } catch (error) {
    console.error('IPC error fetching current song:', error);
    showLoginView(); // Assume auth issue on IPC error
  }
}

async function fetchQueue() {
  if (!isAuthenticated) return;
  console.log('Renderer: Requesting next song in queue...');
  try {
    const data = await window.spotify.getQueue();
    if (data && !data.error) {
      nextSongNameEl.textContent = data.name || '--';
      nextSongArtistEl.textContent = data.artist || '--';
      nextSongBpmEl.textContent = data.bpm ? `${data.bpm} BPM` : '--';
      nextSongArtEl.src = data.albumArt || '';
      nextSongArtEl.style.display = data.albumArt ? 'block' : 'none';
    } else {
      console.error('Error fetching queue from main:', data ? data.error : 'Unknown error');
      nextSongNameEl.textContent = data && data.name ? data.name : 'Queue empty or error'; // Display 'Queue empty' if applicable
      nextSongArtistEl.textContent = '--';
      nextSongBpmEl.textContent = '--';
      nextSongArtEl.src = '';
      nextSongArtEl.style.display = 'none';
      if (data && data.error === 'Not authenticated') showLoginView();
    }
  } catch (error) {
    console.error('IPC error fetching queue:', error);
    // Don't force login view just for queue error unless it's clearly auth
  }
}

function fetchAllSongData() {
  fetchCurrentlyPlaying();
  fetchQueue();
}

// --- Event Listeners ---
loginButton.addEventListener('click', async () => {
  console.log('Login button clicked');
  try {
    await window.spotify.startAuthFlow();
    // The main process will open the auth URL.
    // Success/failure will be handled by onAuthSuccess/onAuthRequired listeners.
    // We might want to give some feedback here, like "Redirecting to Spotify..."
    loginButton.textContent = 'Connecting to Spotify...';
    loginButton.disabled = true;
  } catch (error) {
    console.error('Error starting auth flow:', error);
    alert('Could not start Spotify login. Check console for details.');
    loginButton.textContent = 'Login with Spotify';
    loginButton.disabled = false;
  }
});

window.spotify.onAuthSuccess(() => {
  console.log('Renderer: Authentication successful!');
  isAuthenticated = true;
  loginButton.textContent = 'Login with Spotify'; // Reset button text
  loginButton.disabled = false;
  showDataView();
});

window.spotify.onAuthRequired(() => {
  console.log('Renderer: Authentication required.');
  isAuthenticated = false;
  showLoginView();
  alert('Spotify authentication is required. Please log in again.');
});

// --- Initial Setup ---
// Determine initial view based on whether we might already be authenticated (e.g. if tokens were persisted)
// For now, we always start with the login view until main process confirms auth.
showLoginView(); 

console.log('renderer.js event listeners set up.');
