// ABOUTME: MusicBrainz API client for searching recordings and retrieving MBIDs
// ABOUTME: Implements rate limiting and proper query formatting for artist/track searches

const https = require('https');
const CONSTANTS = require('../utils/constants');

class MusicBrainzClient {
  constructor() {
    this.baseUrl = CONSTANTS.APIS.MUSICBRAINZ_BASE_URL;
    this.lastRequestTime = 0;
    this.minRequestInterval = CONSTANTS.MUSICBRAINZ.RATE_LIMIT_MS;
    this.userAgent = CONSTANTS.MUSICBRAINZ.USER_AGENT;
  }

  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`[MusicBrainz] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  async searchRecording(trackName, artistName) {
    if (!trackName || !artistName) {
      console.warn('[MusicBrainz] Missing trackName or artistName');
      return { error: 'Missing track or artist name for MusicBrainz search' };
    }

    await this.enforceRateLimit();

    // Build query with proper escaping for Lucene syntax
    const escapedArtist = artistName.replace(/([+\-&|!(){}[\]^"~*?:\\])/g, '\\$1');
    const escapedTrack = trackName.replace(/([+\-&|!(){}[\]^"~*?:\\])/g, '\\$1');
    const query = `artist:"${escapedArtist}" AND recording:"${escapedTrack}"`;
    const encodedQuery = encodeURIComponent(query);
    
    console.log(`[MusicBrainz] Searching for: "${trackName}" by "${artistName}"`);
    console.log(`[MusicBrainz] Query: ${query}`);
    
    const fullPath = `/ws/2/recording?query=${encodedQuery}&fmt=json&limit=${CONSTANTS.MUSICBRAINZ.SEARCH_LIMIT}`;
    console.log(`[MusicBrainz] Requesting: https://${this.baseUrl}${fullPath}`);

    return new Promise((resolve) => {
      const options = {
        hostname: this.baseUrl,
        path: fullPath,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': this.userAgent
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const parsedData = JSON.parse(data);
              if (parsedData.recordings && parsedData.recordings.length > 0) {
                // Find best match based on artist and title similarity
                let bestMatch = null;
                let bestScore = 0;

                for (const recording of parsedData.recordings) {
                  let score = 0;
                  
                  // Check title similarity
                  if (recording.title && recording.title.toLowerCase() === trackName.toLowerCase()) {
                    score += 2;
                  } else if (recording.title && recording.title.toLowerCase().includes(trackName.toLowerCase())) {
                    score += 1;
                  }

                  // Check artist similarity
                  if (recording['artist-credit'] && recording['artist-credit'].length > 0) {
                    const recordingArtist = recording['artist-credit'][0].name;
                    if (recordingArtist.toLowerCase() === artistName.toLowerCase()) {
                      score += 2;
                    } else if (recordingArtist.toLowerCase().includes(artistName.toLowerCase()) || 
                               artistName.toLowerCase().includes(recordingArtist.toLowerCase())) {
                      score += 1;
                    }
                  }

                  if (score > bestScore) {
                    bestScore = score;
                    bestMatch = recording;
                  }
                }

                if (bestMatch && bestMatch.id) {
                  const artistInfo = bestMatch['artist-credit'] ? bestMatch['artist-credit'][0].name : 'Unknown';
                  console.log(`[MusicBrainz] Found match: "${bestMatch.title}" by "${artistInfo}" (MBID: ${bestMatch.id})`);
                  resolve({ mbid: bestMatch.id, title: bestMatch.title, artist: artistInfo });
                } else {
                  console.warn(`[MusicBrainz] No suitable match found for "${trackName}" by "${artistName}"`);
                  resolve({ error: 'No suitable match found in MusicBrainz' });
                }
              } else {
                console.warn(`[MusicBrainz] No recordings found for query: ${query}`);
                resolve({ error: 'No recordings found in MusicBrainz' });
              }
            } else if (res.statusCode === 503) {
              console.error('[MusicBrainz] Rate limit exceeded (503)');
              resolve({ error: 'MusicBrainz rate limit exceeded' });
            } else {
              console.error(`[MusicBrainz] Error: Status ${res.statusCode}`, data);
              resolve({ error: `MusicBrainz API error: ${res.statusCode}` });
            }
          } catch (e) {
            console.error('[MusicBrainz] Error parsing JSON:', e, "Raw data:", data);
            resolve({ error: 'Failed to parse response from MusicBrainz' });
          }
        });
      });

      req.on('error', (e) => {
        console.error('[MusicBrainz] Request error:', e);
        resolve({ error: `Request failed for MusicBrainz: ${e.message}` });
      });
      
      req.end();
    });
  }
}

module.exports = new MusicBrainzClient();