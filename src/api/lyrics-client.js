// ABOUTME: Genius API client for fetching song lyrics
// ABOUTME: Handles lyrics retrieval with caching and content cleaning

const { getLyrics } = require('genius-lyrics-api');
const config = require('../utils/config-loader');

class LyricsClient {
  constructor() {
    this.apiKey = null;
    this.cache = new Map();
  }

  getApiKey() {
    if (!this.apiKey) {
      this.apiKey = config.get('geniusApiKey');
    }
    return this.apiKey;
  }

  cleanLyricsContent(lyrics) {
    if (!lyrics || typeof lyrics !== 'string') return lyrics;
    
    const songSectionPattern = /\[(?:Verse|Chorus|Intro|Bridge|Outro|Pre-Chorus|Refrain|Hook|Break|Interlude|Spoken|Rap|Verse \d+|Chorus \d+|Pre-Chorus \d+|Hook \d+|Bridge \d+|Outro \d+|Intro \d+).*?\]/i;
    
    const match = lyrics.match(songSectionPattern);
    if (match) {
      const startIndex = lyrics.indexOf(match[0]);
      let cleaned = lyrics.substring(startIndex);
      cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
      cleaned = cleaned.trim();
      return cleaned;
    }
    
    let cleaned = lyrics;
    const lines = cleaned.split('\n');
    let startLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      if (line.match(/^\d+\s+Contributors?/i) ||
          line.match(/Translations/i) ||
          line.match(/Lyrics$/i) ||
          line.match(/^".*"$/i) ||
          line.match(/Read More/i) ||
          line.match(/https?:\/\//i) ||
          line.match(/^[a-zA-Zàáâãäåæçèéêëìíîïñòóôõöøùúûüýÿœšžğıαβγδεζηθικλμνξοπρστυφχψωأبتثجحخدذرزسشصضطظعغفقكلمنهويءابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]{20,}$/)) {
        continue;
      }
      
      startLine = i;
      break;
    }
    
    cleaned = lines.slice(startLine).join('\n');
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  async fetchLyrics(trackName, artistName) {
    if (!trackName || !artistName) {
      console.warn('[Genius] Missing trackName or artistName');
      return { error: 'Missing track or artist name for lyrics lookup' };
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.error('[Genius] API Key is missing or not loaded from config.json!');
      return { error: 'Genius API Key is not configured' };
    }

    const cacheKey = `${artistName}-${trackName}`.toLowerCase();
    if (this.cache.has(cacheKey)) {
      console.log(`[Genius] Returning cached lyrics for "${trackName}" by "${artistName}"`);
      return this.cache.get(cacheKey);
    }

    console.log(`[Genius] Fetching lyrics for: "${trackName}" by "${artistName}"`);
    
    try {
      const options = {
        apiKey: apiKey,
        title: trackName,
        artist: artistName,
        optimizeQuery: true
      };
      
      const lyrics = await getLyrics(options);
      
      if (lyrics) {
        const cleanedLyrics = this.cleanLyricsContent(lyrics);
        const result = { lyrics: cleanedLyrics };
        this.cache.set(cacheKey, result);
        console.log(`[Genius] Successfully fetched lyrics for "${trackName}"`);
        return result;
      } else {
        console.warn(`[Genius] No lyrics found for "${trackName}" by "${artistName}"`);
        const errorResult = { error: 'No lyrics found' };
        this.cache.set(cacheKey, errorResult);
        return errorResult;
      }
    } catch (error) {
      console.error(`[Genius] Error fetching lyrics for "${trackName}":`, error);
      return { error: `Failed to fetch lyrics: ${error.message}` };
    }
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheSize() {
    return this.cache.size;
  }
}

module.exports = new LyricsClient();