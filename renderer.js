// renderer.js - Handles the logic for the Spotify BPM Viewer's interface

console.log('renderer.js loaded, now with IPC capabilities.');

// DOM Elements
const loginButton = document.getElementById('login-button');
const currentSongInfoDiv = document.getElementById('current-song-info');
const nextSongInfoDiv = document.getElementById('next-song-info');
const lyricsPanel = document.getElementById('lyrics-panel');
const lyricsContent = document.getElementById('lyrics-content');
const lyricsToggleBtn = document.getElementById('lyrics-toggle');
const themeToggleBtn = document.getElementById('theme-toggle');

// Get all DOM element references
const currentSongNameEl = document.getElementById('current-song-name');
const currentSongArtistEl = document.getElementById('current-song-artist');
const currentSongBpmEl = document.getElementById('current-song-bpm');
const currentSongBpmContainer = currentSongBpmEl.parentElement; // The <p> element containing "BPM:"
const currentSongArtEl = document.getElementById('current-song-art');

const nextSongNameEl = document.getElementById('next-song-name');
const nextSongArtistEl = document.getElementById('next-song-artist');
const nextSongBpmEl = document.getElementById('next-song-bpm');
const nextSongBpmContainer = nextSongBpmEl.parentElement; // The <p> element containing "BPM:"
const nextSongArtEl = document.getElementById('next-song-art');

let isAuthenticated = false;
let dataFetchInterval = null;
let currentTrackName = null;
let currentArtistName = null;
let showLyrics = localStorage.getItem('showLyrics') !== 'false'; // Default to true

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
    if (data && !data.error) {
      // Show paused indicator if not playing
      const pausedIndicator = data.is_playing === false ? ' ⏸️' : '';
      currentSongNameEl.textContent = (data.name || '--') + pausedIndicator;
      currentSongArtistEl.textContent = data.artist || '--';
      if (data.bpm) {
        let bpmText = `${data.bpm}`;
        if (data.bpmSource) {
          const sourceLabel = data.bpmSource === 'acousticbrainz' ? 'MB' : 'GSB';
          const sourceFullName = data.bpmSource === 'acousticbrainz' ? 'MusicBrainz/AcousticBrainz' : 'GetSongBPM';
          bpmText += ` (${sourceLabel})`;
          currentSongBpmEl.title = `BPM source: ${sourceFullName}`;
        } else {
          currentSongBpmEl.title = '';
        }
        currentSongBpmEl.textContent = bpmText;
        currentSongBpmContainer.style.display = 'block'; // Show the entire BPM line
      } else {
        currentSongBpmContainer.style.display = 'none'; // Hide the entire BPM line
      }
      if (data.albumArt) {
        currentSongArtEl.src = data.albumArt;
        currentSongArtEl.style.display = 'block';
      } else {
        currentSongArtEl.style.display = 'none';
      }
      
      // Add visual styling for paused state
      if (data.is_playing === false) {
        currentSongInfoDiv.style.opacity = '0.85';
        currentSongInfoDiv.style.borderLeft = '4px solid var(--text-secondary)';
      } else {
        currentSongInfoDiv.style.opacity = '1';
        currentSongInfoDiv.style.borderLeft = '4px solid var(--accent-primary)';
      }
      
      // Fetch lyrics if the song has changed and lyrics panel is visible
      // Only fetch new lyrics if it's actually a different song (not just a play/pause change)
      if ((data.name !== currentTrackName || data.artist !== currentArtistName) && 
          data.name && data.name !== '--' && data.name !== 'Nothing playing or private session.') {
        currentTrackName = data.name;
        currentArtistName = data.artist;
        // Only fetch lyrics if the panel is visible
        if (showLyrics) {
          // Extract just the first artist name for lyrics search
          const firstArtist = data.artist ? data.artist.split(',')[0].trim() : '';
          fetchLyrics(data.name, firstArtist);
        }
      }
    } else {
      console.error('Error fetching current song from main:', data ? data.error : 'Unknown error');
      currentSongNameEl.textContent = data && data.name ? data.name : 'Error or nothing playing'; // Display 'Nothing playing' if applicable
      currentSongArtistEl.textContent = '--';
      currentSongBpmContainer.style.display = 'none'; // Hide BPM line when no data
      currentSongArtEl.style.display = 'none';
      
      // Clear lyrics when nothing is playing
      if (data && data.name === 'Nothing playing or private session.') {
        currentTrackName = null;
        currentArtistName = null;
        lyricsContent.innerHTML = '<p class="lyrics-placeholder">No song playing</p>';
      }
      
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
      if (data.bpm) {
        let bpmText = `${data.bpm}`;
        if (data.bpmSource) {
          const sourceLabel = data.bpmSource === 'acousticbrainz' ? 'MB' : 'GSB';
          const sourceFullName = data.bpmSource === 'acousticbrainz' ? 'MusicBrainz/AcousticBrainz' : 'GetSongBPM';
          bpmText += ` (${sourceLabel})`;
          nextSongBpmEl.title = `BPM source: ${sourceFullName}`;
        } else {
          nextSongBpmEl.title = '';
        }
        nextSongBpmEl.textContent = bpmText;
        nextSongBpmContainer.style.display = 'block'; // Show the entire BPM line
      } else {
        nextSongBpmContainer.style.display = 'none'; // Hide the entire BPM line
      }
      if (data.albumArt) {
        nextSongArtEl.src = data.albumArt;
        nextSongArtEl.style.display = 'block';
      } else {
        nextSongArtEl.style.display = 'none';
      }
    } else {
      console.error('Error fetching queue from main:', data ? data.error : 'Unknown error');
      nextSongNameEl.textContent = data && data.name ? data.name : 'Queue empty or error'; // Display 'Queue empty' if applicable
      nextSongArtistEl.textContent = '--';
      nextSongBpmContainer.style.display = 'none'; // Hide BPM line when no data
      nextSongArtEl.style.display = 'none';
      if (data && data.error === 'Not authenticated') showLoginView();
    }
  } catch (error) {
    console.error('IPC error fetching queue:', error);
    // Don't force login view just for queue error unless it's clearly auth
  }
}

async function fetchLyrics(trackName, artistName) {
  if (!trackName || !artistName) {
    lyricsContent.innerHTML = '<p class="lyrics-placeholder">No song playing</p>';
    return;
  }
  
  // Show loading state
  lyricsContent.innerHTML = '<p class="lyrics-loading">Loading lyrics...</p>';
  
  try {
    const data = await window.spotify.getLyrics(trackName, artistName);
    if (data && data.lyrics) {
      // Format lyrics with proper line breaks
      const formattedLyrics = data.lyrics.split('\n').map(line => line.trim()).join('\n');
      lyricsContent.textContent = formattedLyrics;
    } else if (data && data.error) {
      console.warn('Lyrics error:', data.error);
      lyricsContent.innerHTML = '<p class="lyrics-placeholder">Lyrics not available</p>';
    } else {
      lyricsContent.innerHTML = '<p class="lyrics-placeholder">Lyrics not available</p>';
    }
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    lyricsContent.innerHTML = '<p class="lyrics-placeholder">Error loading lyrics</p>';
  }
}

function toggleLyrics() {
  showLyrics = !showLyrics;
  
  if (showLyrics) {
    lyricsPanel.classList.remove('lyrics-hidden');
    lyricsToggleBtn.classList.add('active');
    // Fetch lyrics for current song if we have one
    if (currentTrackName && currentArtistName) {
      const firstArtist = currentArtistName.split(',')[0].trim();
      fetchLyrics(currentTrackName, firstArtist);
    }
  } else {
    lyricsPanel.classList.add('lyrics-hidden');
    lyricsToggleBtn.classList.remove('active');
  }
  
  // Save preference
  localStorage.setItem('showLyrics', showLyrics);
}

function fetchAllSongData() {
  fetchCurrentlyPlaying();
  fetchQueue();
}

// --- Event Listeners ---
lyricsToggleBtn.addEventListener('click', toggleLyrics);

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

// --- Theme Toggle Functionality ---
function updateThemeButton(theme) {
  if (theme === 'dark') {
    themeToggleBtn.textContent = '☀️';
    themeToggleBtn.title = 'Switch to light mode';
  } else {
    themeToggleBtn.textContent = '🌙';
    themeToggleBtn.title = 'Switch to dark mode';
  }
}

// Initialize theme button with current theme
updateThemeButton(window.themeManager.getCurrentTheme());

// Listen for theme changes
window.themeManager.addThemeChangeListener((newTheme) => {
  updateThemeButton(newTheme);
  console.log(`Theme changed to: ${newTheme}`);
});

// Theme toggle button event listeners
themeToggleBtn.addEventListener('click', () => {
  const newTheme = window.themeManager.toggleTheme();
  console.log(`Theme toggled to: ${newTheme}`);
});

// Keyboard accessibility for theme toggle
themeToggleBtn.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const newTheme = window.themeManager.toggleTheme();
    console.log(`Theme toggled via keyboard to: ${newTheme}`);
  }
});

// --- Initial Setup ---
// Apply saved lyrics visibility preference
if (!showLyrics) {
  lyricsPanel.classList.add('lyrics-hidden');
  lyricsToggleBtn.classList.remove('active');
} else {
  lyricsToggleBtn.classList.add('active');
}

// Determine initial view based on whether we might already be authenticated (e.g. if tokens were persisted)
// For now, we always start with the login view until main process confirms auth.
showLoginView(); 

console.log('renderer.js event listeners set up.');
