// ABOUTME: Configuration loading and validation module
// ABOUTME: Handles reading config.json and setting up API keys with error handling

const fs = require('fs');
const path = require('path');

class ConfigLoader {
  constructor() {
    this.config = null;
    this.isLoaded = false;
  }

  loadConfig() {
    if (this.isLoaded) {
      return this.config;
    }

    try {
      const configPath = path.join(__dirname, '../../config.json');
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf-8');
        this.config = JSON.parse(configFile);
        this.validateConfig();
        this.isLoaded = true;
        console.log('[CONFIG] Configuration loaded successfully');
      } else {
        console.error('[CONFIG] config.json file not found. Please create it with your API keys.');
        this.config = {};
      }
    } catch (error) {
      console.error('[CONFIG] Error reading or parsing config.json:', error);
      this.config = {};
    }

    return this.config;
  }

  validateConfig() {
    const required = ['getSongBpmApiKey', 'spotifyClientId', 'spotifyClientSecret', 'geniusApiKey'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      console.warn(`[CONFIG] Missing required configuration keys: ${missing.join(', ')}`);
    }

    if (!this.config.getSongBpmApiKey) {
      console.error('[CONFIG] GetSongBPM API Key is not configured in config.json. BPM feature may be disabled.');
    }
    if (!this.config.spotifyClientId || !this.config.spotifyClientSecret) {
      console.error('[CONFIG] Spotify Client ID or Secret is not configured in config.json. Spotify authentication will likely fail.');
    }
    if (!this.config.geniusApiKey) {
      console.error('[CONFIG] Genius API Key is not configured in config.json. Lyrics feature will be disabled.');
    }
  }

  get(key) {
    if (!this.isLoaded) {
      this.loadConfig();
    }
    return this.config[key];
  }

  getAll() {
    if (!this.isLoaded) {
      this.loadConfig();
    }
    return this.config;
  }
}

module.exports = new ConfigLoader();