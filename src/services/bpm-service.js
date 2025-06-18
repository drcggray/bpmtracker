// ABOUTME: BPM service orchestrator that manages multiple BPM data sources
// ABOUTME: Implements fallback strategy with MusicBrainz/AcousticBrainz primary, GetSongBPM secondary

const bpmClient = require('../api/bpm-client');
const musicBrainzClient = require('../api/musicbrainz-client');
const acousticBrainzClient = require('../api/acousticbrainz-client');

class BpmService {
  async fetchBpmWithFallback(trackName, artistName) {
    if (!trackName || !artistName) {
      console.warn('[BpmService] Missing trackName or artistName');
      return { bpm: null, source: null, error: 'Missing track or artist name' };
    }

    console.log(`[BpmService] Fetching BPM for "${trackName}" by "${artistName}"`);

    // Try MusicBrainz/AcousticBrainz first
    try {
      const mbResult = await musicBrainzClient.searchRecording(trackName, artistName);
      
      if (mbResult && mbResult.mbid && !mbResult.error) {
        console.log(`[BpmService] Found MBID: ${mbResult.mbid}, fetching from AcousticBrainz`);
        
        const abResult = await acousticBrainzClient.fetchBpmByMbid(mbResult.mbid);
        
        if (abResult && abResult.bpm && !abResult.error) {
          console.log(`[BpmService] Success: Got BPM ${abResult.bpm} from AcousticBrainz`);
          return {
            bpm: Math.round(abResult.bpm),
            source: 'acousticbrainz',
            preciseBpm: abResult.bpm
          };
        } else {
          console.log(`[BpmService] AcousticBrainz has no BPM data for MBID: ${mbResult.mbid}`);
        }
      } else {
        console.log('[BpmService] MusicBrainz search found no matches');
      }
    } catch (error) {
      console.error('[BpmService] Error with MusicBrainz/AcousticBrainz:', error);
    }

    // Fall back to GetSongBPM
    console.log('[BpmService] Falling back to GetSongBPM');
    try {
      const gsbResult = await bpmClient.fetchBpm(trackName, artistName);
      
      if (gsbResult && gsbResult.bpm && !gsbResult.error) {
        console.log(`[BpmService] Success: Got BPM ${gsbResult.bpm} from GetSongBPM`);
        return {
          bpm: gsbResult.bpm,
          source: 'getsongbpm'
        };
      } else {
        console.log('[BpmService] GetSongBPM returned no BPM data');
        return {
          bpm: null,
          source: null,
          error: gsbResult.error || 'No BPM data found in any source'
        };
      }
    } catch (error) {
      console.error('[BpmService] Error with GetSongBPM:', error);
      return {
        bpm: null,
        source: null,
        error: 'Failed to fetch BPM from all sources'
      };
    }
  }
}

module.exports = new BpmService();