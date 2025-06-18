// ABOUTME: Application constants and configuration values
// ABOUTME: Centralized location for all magic numbers and static values

const CONSTANTS = {
  // Spotify Configuration
  SPOTIFY: {
    REDIRECT_URI: 'http://127.0.0.1:8888/callback',
    SCOPES: [
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
    ],
    STATE_VALUE: 'some-state-value'
  },

  // Server Configuration
  SERVER: {
    PORT: 8888,
    HOST: '127.0.0.1'
  },

  // Polling and Refresh Intervals
  INTERVALS: {
    SONG_POLL_MS: 5000,
    TOKEN_REFRESH_BUFFER_RATIO: 0.5,
    CACHE_CLEANUP_MS: 30 * 60 * 1000
  },

  // Cache TTL Values
  CACHE_TTL: {
    LYRICS_MS: 24 * 60 * 60 * 1000,
    BPM_MS: 7 * 24 * 60 * 60 * 1000,
    TRACKS_MS: 5 * 60 * 1000
  },

  // Window Configuration
  WINDOW: {
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 700
  },

  // API Configuration
  APIS: {
    SPOTIFY_BASE_URL: 'api.spotify.com',
    GETSONGBPM_BASE_URL: 'api.getsong.co',
    MUSICBRAINZ_BASE_URL: 'musicbrainz.org',
    ACOUSTICBRAINZ_BASE_URL: 'acousticbrainz.org'
  },
  
  // MusicBrainz Configuration
  MUSICBRAINZ: {
    RATE_LIMIT_MS: 1000,
    USER_AGENT: 'SpotifyBPMViewer/1.0 (https://github.com/yourusername/spotify-bpm-viewer)',
    SEARCH_LIMIT: 5
  },

  // Default Values
  DEFAULTS: {
    BPM_VALUE: 'N/A',
    UNKNOWN_ARTIST: 'Unknown Artist',
    NOTHING_PLAYING: 'Nothing playing or private session.',
    QUEUE_EMPTY: 'Queue is empty or unavailable.',
    QUEUE_END: 'End of queue.'
  },

  // File Size and Timeout Limits
  LIMITS: {
    REQUEST_TIMEOUT_MS: 10000,
    MAX_CACHE_SIZE: 1000
  }
};

module.exports = CONSTANTS;