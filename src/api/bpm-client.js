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

    // Search by track name only, then filter by artist in results
    const searchQuery = encodeURIComponent(trackName);
    
    console.log(`[GetSongBPM] Searching for: "${trackName}" by "${artistName}"`);
    
    const fullPath = `/search/?api_key=${apiKey}&type=song&lookup=${searchQuery}`;
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
              
              // Handle search results
              if (parsedData.search && Array.isArray(parsedData.search) && parsedData.search.length > 0) {
                // Find the best match by artist name
                let bestMatch = null;
                let bestScore = 0;
                
                for (const song of parsedData.search) {
                  let score = 0;
                  
                  // Check if song has tempo data
                  if (!song.tempo) continue;
                  
                  // Check artist match
                  if (song.artist && song.artist.name) {
                    const songArtist = song.artist.name.toLowerCase();
                    const searchArtist = artistName.toLowerCase();
                    
                    if (songArtist === searchArtist) {
                      score += 10; // Exact match
                    } else if (songArtist.includes(searchArtist) || searchArtist.includes(songArtist)) {
                      score += 5; // Partial match
                    }
                  }
                  
                  // Check title match
                  if (song.title) {
                    const songTitle = song.title.toLowerCase();
                    const searchTitle = trackName.toLowerCase();
                    
                    if (songTitle === searchTitle) {
                      score += 10; // Exact match
                    } else if (songTitle.includes(searchTitle) || searchTitle.includes(songTitle)) {
                      score += 5; // Partial match
                    }
                  }
                  
                  if (score > bestScore) {
                    bestScore = score;
                    bestMatch = song;
                  }
                }
                
                if (bestMatch && bestMatch.tempo) {
                  const bpm = Math.round(parseFloat(bestMatch.tempo));
                  const foundArtistName = bestMatch.artist ? bestMatch.artist.name : 'Unknown Artist';
                  console.log(`[GetSongBPM] Success: Found BPM ${bpm} for "${bestMatch.title}" by "${foundArtistName}". Score: ${bestScore}`);
                  resolve({ bpm });
                } else {
                  console.warn(`[GetSongBPM] No suitable matches found for "${trackName}" by "${artistName}"`);
                  resolve({ error: 'No suitable matches found in GetSongBPM response' });
                }
              } else if (parsedData.search && parsedData.search.error) {
                console.warn(`[GetSongBPM] Search error: ${parsedData.search.error}`);
                resolve({ error: 'No results found in GetSongBPM response' });
              } else {
                console.warn(`[GetSongBPM] No results found for "${trackName}"`);
                resolve({ error: 'No results found in GetSongBPM response' });
              }
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