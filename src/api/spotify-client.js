// ABOUTME: Spotify API client for making direct HTTP requests
// ABOUTME: Handles currently playing and queue endpoints with proper error handling

const https = require('https');

class SpotifyClient {
  constructor() {
    this.baseUrl = 'api.spotify.com';
  }

  async fetchCurrentlyPlaying(accessToken) {
    if (!accessToken) {
      return Promise.resolve({ error: 'Not authenticated for currently playing fetch' });
    }

    return new Promise((resolve) => {
      const options = {
        hostname: this.baseUrl,
        path: '/v1/me/player',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const parsedData = JSON.parse(data);
              resolve(parsedData);
            } else if (res.statusCode === 204) {
              console.log('[DEBUG] fetchCurrentlyPlaying received 204 No Content.');
              resolve({ item: null, is_playing: false });
            } else {
              console.error(`Error fetching currently playing: Status ${res.statusCode}`, data);
              resolve({ 
                error: { 
                  message: `Spotify API error for currently playing: ${res.statusCode}`, 
                  details: data, 
                  statusCode: res.statusCode 
                } 
              });
            }
          } catch (e) {
            console.error('Error parsing currently playing JSON:', e);
            resolve({ 
              error: { 
                message: 'Failed to parse currently playing response from Spotify', 
                details: e.message 
              } 
            });
          }
        });
      });

      req.on('error', (e) => {
        console.error('Error with currently playing request:', e);
        resolve({ 
          error: { 
            message: `Request failed for currently playing: ${e.message}`, 
            details: e.toString() 
          } 
        });
      });
      
      req.end();
    });
  }

  async fetchQueue(accessToken) {
    if (!accessToken) {
      return Promise.resolve({ error: 'Not authenticated for queue fetch' });
    }

    return new Promise((resolve) => {
      const options = {
        hostname: this.baseUrl,
        path: '/v1/me/player/queue',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const parsedData = JSON.parse(data);
              resolve(parsedData);
            } else {
              console.error(`Error fetching queue: Status ${res.statusCode}`, data);
              resolve({ 
                error: { 
                  message: `Spotify API error for queue: ${res.statusCode}`, 
                  details: data, 
                  statusCode: res.statusCode 
                } 
              });
            }
          } catch (e) {
            console.error('Error parsing queue JSON:', e);
            resolve({ 
              error: { 
                message: 'Failed to parse queue response from Spotify', 
                details: e.message 
              } 
            });
          }
        });
      });

      req.on('error', (e) => {
        console.error('Error with queue request:', e);
        resolve({ 
          error: { 
            message: `Request failed for queue: ${e.message}`, 
            details: e.toString() 
          } 
        });
      });
      
      req.end();
    });
  }
}

module.exports = new SpotifyClient();