// ABOUTME: GetSongBPM API client for fetching tempo data
// ABOUTME: Handles BPM lookups with proper URL encoding and error handling

const https = require('https');
const config = require('../utils/config-loader');

class BpmClient {
  constructor() {
    this.baseUrl = 'api.getsong.co';
    this.apiKey = null;
  }

  getApiKey() {
    if (!this.apiKey) {
      this.apiKey = config.get('getSongBpmApiKey');
    }
    return this.apiKey;
  }

  async fetchBpm(trackName, artistName) {
    if (!trackName || !artistName) {
      console.warn('[GetSongBPM] Missing trackName or artistName');
      return { error: 'Missing track or artist name for BPM lookup' };
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.error('[GetSongBPM] API Key is missing or not loaded from config.json!');
      return { error: 'GetSongBPM API Key is not configured' };
    }

    const trackNameForApi = encodeURIComponent(trackName).replace(/%20/g, '+');
    const artistNameForApi = encodeURIComponent(artistName).replace(/%20/g, '+');
    const lookupParamValue = `song:${trackNameForApi}+artist:${artistNameForApi}`;
    
    console.log(`[GetSongBPM] Fetching BPM using type=both for: "${trackName}" by "${artistName}". Lookup: "${lookupParamValue}"`);
    
    const fullPath = `/search/?api_key=${apiKey}&type=both&limit=1&lookup=${encodeURIComponent(lookupParamValue)}`;
    console.log(`[GetSongBPM] Requesting Path: https://${this.baseUrl}${fullPath}`);

    return new Promise((resolve) => {
      const options = {
        hostname: this.baseUrl,
        path: fullPath,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SpotifyBPMViewer/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const parsedData = JSON.parse(data);
              if (parsedData.search && parsedData.search.length > 0) {
                const foundSong = parsedData.search[0];
                if (foundSong.tempo) {
                  let artistMatchQuality = 'none';
                  if (foundSong.artist && foundSong.artist.name) {
                    if (foundSong.artist.name.toLowerCase() === artistName.toLowerCase()) {
                      artistMatchQuality = 'exact';
                    } else if (foundSong.artist.name.toLowerCase().includes(artistName.toLowerCase()) || 
                               artistName.toLowerCase().includes(foundSong.artist.name.toLowerCase())) {
                      artistMatchQuality = 'partial';
                    }
                  }
                  
                  const bpm = Math.round(parseFloat(foundSong.tempo));
                  console.log(`[GetSongBPM] Success: Found BPM ${bpm} for "${foundSong.title}" by "${foundSong.artist ? foundSong.artist.name : 'Unknown Artist'}". Artist match: ${artistMatchQuality}.`);
                  resolve({ bpm });
                } else {
                  console.warn(`[GetSongBPM] Song found for "${trackName}" ("${foundSong.title}"), but no tempo data.`);
                  resolve({ error: 'Song found, but no tempo data in GetSongBPM response' });
                }
              } else {
                console.warn(`[GetSongBPM] No results found for lookup "${lookupParamValue}":`, parsedData.search || parsedData);
                resolve({ error: 'No results found in GetSongBPM response' });
              }
            } else if (parsedData && parsedData.error) {
              console.error(`[GetSongBPM] API returned error for "${lookupParamValue}": ${parsedData.error}`);
              resolve({ error: `GetSongBPM API error: ${parsedData.error}` });
            } else {
              console.error(`[GetSongBPM] Error: Status ${res.statusCode}`, data);
              resolve({ error: { message: `GetSongBPM API error: ${res.statusCode}`, details: data, statusCode: res.statusCode } });
            }
          } catch (e) {
            console.error('[GetSongBPM] Error parsing JSON:', e, "Raw data:", data);
            resolve({ error: { message: 'Failed to parse response from GetSongBPM', details: e.message } });
          }
        });
      });

      req.on('error', (e) => {
        console.error('[GetSongBPM] Request error:', e);
        resolve({ error: { message: `Request failed for GetSongBPM: ${e.message}`, details: e.toString() } });
      });
      
      req.end();
    });
  }
}

module.exports = new BpmClient();