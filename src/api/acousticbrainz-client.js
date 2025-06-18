// ABOUTME: AcousticBrainz API client for fetching acoustic data including BPM
// ABOUTME: Retrieves tempo information using MusicBrainz recording IDs (MBIDs)

const https = require('https');

class AcousticBrainzClient {
  constructor() {
    this.baseUrl = 'acousticbrainz.org';
  }

  async fetchBpmByMbid(mbid) {
    if (!mbid) {
      console.warn('[AcousticBrainz] Missing MBID');
      return { error: 'Missing MBID for AcousticBrainz lookup' };
    }

    console.log(`[AcousticBrainz] Fetching BPM for MBID: ${mbid}`);
    
    const fullPath = `/api/v1/low-level?recording_ids=${mbid}`;
    console.log(`[AcousticBrainz] Requesting: https://${this.baseUrl}${fullPath}`);

    return new Promise((resolve) => {
      const options = {
        hostname: this.baseUrl,
        path: fullPath,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
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
              
              // Check if we have data for this MBID
              if (parsedData && parsedData[mbid]) {
                const recordingData = parsedData[mbid];
                
                // Look for BPM in the rhythm section
                if (recordingData['0'] && recordingData['0'].rhythm && recordingData['0'].rhythm.bpm) {
                  const bpm = recordingData['0'].rhythm.bpm;
                  console.log(`[AcousticBrainz] Found BPM: ${bpm} for MBID: ${mbid}`);
                  
                  // Return the BPM rounded to 1 decimal place
                  resolve({ bpm: Math.round(bpm * 10) / 10 });
                } else {
                  console.warn(`[AcousticBrainz] No BPM data found in response for MBID: ${mbid}`);
                  resolve({ error: 'No BPM data available in AcousticBrainz' });
                }
              } else {
                console.warn(`[AcousticBrainz] No data found for MBID: ${mbid}`);
                resolve({ error: 'Recording not found in AcousticBrainz' });
              }
            } else if (res.statusCode === 404) {
              console.warn(`[AcousticBrainz] Recording not found for MBID: ${mbid}`);
              resolve({ error: 'Recording not found in AcousticBrainz' });
            } else {
              console.error(`[AcousticBrainz] Error: Status ${res.statusCode}`, data);
              resolve({ error: `AcousticBrainz API error: ${res.statusCode}` });
            }
          } catch (e) {
            console.error('[AcousticBrainz] Error parsing JSON:', e, "Raw data:", data);
            resolve({ error: 'Failed to parse response from AcousticBrainz' });
          }
        });
      });

      req.on('error', (e) => {
        console.error('[AcousticBrainz] Request error:', e);
        resolve({ error: `Request failed for AcousticBrainz: ${e.message}` });
      });
      
      req.end();
    });
  }
}

module.exports = new AcousticBrainzClient();