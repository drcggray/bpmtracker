// ABOUTME: Business logic service for track data processing
// ABOUTME: Orchestrates Spotify, BPM, and lyrics data retrieval with caching

const spotifyClient = require('../api/spotify-client');
const bmpClient = require('../api/bpm-client');
const lyricsClient = require('../api/lyrics-client');
const cacheService = require('./cache-service');
const TrackCleaner = require('../utils/track-cleaner');

class TrackService {
  constructor() {
    this.accessToken = null;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  async getCurrentlyPlaying() {
    if (!this.accessToken) {
      return { error: 'Not authenticated' };
    }

    try {
      const playbackState = await spotifyClient.fetchCurrentlyPlaying(this.accessToken);

      if (playbackState && playbackState.error) {
        console.error('Error from fetchCurrentlyPlaying:', playbackState.error);
        throw new Error(playbackState.error.details || playbackState.error.error || playbackState.error.message);
      }
      
      // Check if we have track data, regardless of playing state
      if (playbackState && playbackState.item) {
        const track = playbackState.item;
        const trackName = track.name;
        const mainArtistName = track.artists && track.artists.length > 0 ? track.artists[0].name : 'Unknown Artist';
        
        let bpm = 'N/A';
        const cleanedTrackName = TrackCleaner.cleanTrackTitle(trackName);
        const bmpCacheKey = `${mainArtistName}-${cleanedTrackName}`.toLowerCase();
        
        const cachedBpm = cacheService.get('bpm', bmpCacheKey);
        if (cachedBpm) {
          bpm = cachedBpm.bpm || 'N/A';
        } else {
          const bmpResult = await bmpClient.fetchBpm(cleanedTrackName, mainArtistName);
          if (bmpResult && bmpResult.bpm) {
            bpm = bmpResult.bpm;
            cacheService.set('bpm', bmpCacheKey, { bpm });
          } else if (bmpResult && bmpResult.error) {
            console.warn(`[BPM] Failed to get BPM for current track "${trackName}":`, bmpResult.error.message || bmpResult.error);
            cacheService.set('bpm', bmpCacheKey, { error: bmpResult.error });
          }
        }

        const result = {
          name: trackName,
          artist: track.artists.map(artist => artist.name).join(', '),
          bpm: bpm,
          albumArt: track.album && track.album.images && track.album.images.length > 0 ? track.album.images[0].url : null,
          trackIdForBmp: track.id,
          is_playing: playbackState.is_playing || false,
          last_played_at: Date.now()
        };
        
        // Cache as last played track (persist across pauses)
        cacheService.set('lastPlayed', 'current', result);
        
        console.log('[DEBUG] getCurrentlyPlaying SUCCESS, returning:', JSON.stringify(result, null, 2));
        return result;
      }
      
      // No current track - try to get last played from cache
      const lastPlayed = cacheService.get('lastPlayed', 'current');
      if (lastPlayed) {
        console.log('[DEBUG] No current track, returning last played:', lastPlayed.name);
        return {
          ...lastPlayed,
          is_playing: false // Ensure we show it as paused
        };
      }
      
      return { name: 'Nothing playing or private session.', artist: '', bpm: 'N/A', albumArt: null, is_playing: false };

    } catch (error) {
      console.error('Error in getCurrentlyPlaying:', error);
      return { error: `Failed to fetch currently playing song: ${error.message}`, bpm: 'N/A' };
    }
  }

  async getQueue() {
    if (!this.accessToken) {
      return { error: 'Not authenticated' };
    }

    try {
      const queueApiResponse = await spotifyClient.fetchQueue(this.accessToken);
      console.log('[DEBUG] Raw response from fetchQueue:', JSON.stringify(queueApiResponse, null, 2));

      if (queueApiResponse && queueApiResponse.error) {
        console.error('Error returned from fetchQueue:', queueApiResponse.error);
        return { error: `Queue fetch failed: ${queueApiResponse.error.details || queueApiResponse.error.error || queueApiResponse.error.message}` };
      }

      if (queueApiResponse && queueApiResponse.queue && queueApiResponse.queue.length > 0) {
        const nextTrackRaw = queueApiResponse.queue[0];
        if (nextTrackRaw.type === 'track') {
          const trackName = nextTrackRaw.name;
          const mainArtistName = nextTrackRaw.artists && nextTrackRaw.artists.length > 0 ? nextTrackRaw.artists[0].name : 'Unknown Artist';

          let bpm = 'N/A';
          const cleanedTrackName = TrackCleaner.cleanTrackTitle(trackName);
          const bmpCacheKey = `${mainArtistName}-${cleanedTrackName}`.toLowerCase();
          
          const cachedBpm = cacheService.get('bpm', bmpCacheKey);
          if (cachedBpm) {
            bpm = cachedBpm.bpm || 'N/A';
          } else {
            const bmpResult = await bmpClient.fetchBpm(cleanedTrackName, mainArtistName);
            if (bmpResult && bmpResult.bpm) {
              bpm = bmpResult.bpm;
              cacheService.set('bpm', bmpCacheKey, { bpm });
            } else if (bmpResult && bmpResult.error) {
              console.warn(`[BPM] Failed to get BPM for next track "${trackName}":`, bmpResult.error.message || bmpResult.error);
              cacheService.set('bpm', bmpCacheKey, { error: bmpResult.error });
            }
          }
          
          return {
            name: trackName,
            artist: nextTrackRaw.artists.map(artist => artist.name).join(', '),
            bpm: bpm,
            albumArt: nextTrackRaw.album && nextTrackRaw.album.images && nextTrackRaw.album.images.length > 0 ? nextTrackRaw.album.images[0].url : null,
            trackIdForBpm: nextTrackRaw.id,
          };
        }
      } else if (queueApiResponse && queueApiResponse.currently_playing && (!queueApiResponse.queue || queueApiResponse.queue.length === 0)) {
        return { name: 'End of queue.', artist: '', bpm: 'N/A', albumArt: null };
      }
      
      return { name: 'Queue is empty or unavailable.', artist: '', bpm: 'N/A', albumArt: null };

    } catch (error) {
      console.error('Critical error in getQueue:', error);
      return { error: `Unexpected error in get-queue: ${error.message}`, bpm: 'N/A' };
    }
  }

  async getLyrics(trackName, artistName) {
    if (!this.accessToken) {
      return { error: 'Not authenticated' };
    }
    
    if (!trackName || !artistName) {
      return { error: 'Missing track or artist name' };
    }

    try {
      const cleanedTrackName = TrackCleaner.cleanTrackTitle(trackName);
      const cacheKey = `${artistName}-${cleanedTrackName}`.toLowerCase();
      
      const cachedLyrics = cacheService.get('lyrics', cacheKey);
      if (cachedLyrics) {
        console.log(`[Lyrics] Returning cached lyrics for "${trackName}" by "${artistName}"`);
        return cachedLyrics;
      }

      console.log(`[TrackService] Requesting lyrics for "${trackName}" by "${artistName}"`);
      const lyricsResult = await lyricsClient.fetchLyrics(cleanedTrackName, artistName);
      
      if (lyricsResult) {
        cacheService.set('lyrics', cacheKey, lyricsResult);
      }
      
      return lyricsResult;
    } catch (error) {
      console.error('Error in getLyrics:', error);
      return { error: `Failed to fetch lyrics: ${error.message}` };
    }
  }
}

module.exports = new TrackService();