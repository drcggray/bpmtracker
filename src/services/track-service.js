// ABOUTME: Business logic service for track data processing
// ABOUTME: Orchestrates Spotify, BPM, and lyrics data retrieval with caching

const spotifyClient = require('../api/spotify-client');
const bpmService = require('./bpm-service');
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
        let bpmSource = null;
        const cleanedTrackName = TrackCleaner.cleanTrackTitle(trackName);
        
        // Check cache with multiple possible keys (for backward compatibility and different sources)
        const legacyCacheKey = `${mainArtistName}-${cleanedTrackName}`.toLowerCase();
        const acousticbrainzCacheKey = `acousticbrainz-${mainArtistName}-${cleanedTrackName}`.toLowerCase();
        const getsongbpmCacheKey = `getsongbpm-${mainArtistName}-${cleanedTrackName}`.toLowerCase();
        
        // Try to get from cache (check all possible keys)
        let cachedBpm = cacheService.get('bpm', acousticbrainzCacheKey) || 
                       cacheService.get('bpm', getsongbpmCacheKey) ||
                       cacheService.get('bpm', legacyCacheKey);
        
        if (cachedBpm && cachedBpm.bpm) {
          bpm = cachedBpm.bpm;
          bpmSource = cachedBpm.source || 'cached';
        } else {
          const bpmResult = await bpmService.fetchBpmWithFallback(cleanedTrackName, mainArtistName);
          if (bpmResult && bpmResult.bpm) {
            bpm = bpmResult.bpm;
            bpmSource = bpmResult.source;
            
            // Cache with source-specific key
            const cacheKey = `${bpmResult.source}-${mainArtistName}-${cleanedTrackName}`.toLowerCase();
            cacheService.set('bpm', cacheKey, { bpm, source: bpmResult.source });
            
            console.log(`[TrackService] Got BPM ${bpm} from ${bpmSource} for "${trackName}"`);
          } else if (bpmResult && bpmResult.error) {
            console.warn(`[TrackService] Failed to get BPM for current track "${trackName}":`, bpmResult.error);
            // Cache the failure to avoid repeated lookups
            cacheService.set('bpm', legacyCacheKey, { error: bpmResult.error });
          }
        }

        const result = {
          name: trackName,
          artist: track.artists.map(artist => artist.name).join(', '),
          bpm: bpm,
          bpmSource: bpmSource,
          albumArt: track.album && track.album.images && track.album.images.length > 0 ? track.album.images[0].url : null,
          trackIdForBmp: track.id,
          is_playing: playbackState.is_playing || false,
          last_played_at: Date.now()
        };
        
        // Cache as last played track (persist across pauses)
        cacheService.set('lastPlayed', 'current', result);
        
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
          let bpmSource = null;
          const cleanedTrackName = TrackCleaner.cleanTrackTitle(trackName);
          
          // Check cache with multiple possible keys (for backward compatibility and different sources)
          const legacyCacheKey = `${mainArtistName}-${cleanedTrackName}`.toLowerCase();
          const acousticbrainzCacheKey = `acousticbrainz-${mainArtistName}-${cleanedTrackName}`.toLowerCase();
          const getsongbpmCacheKey = `getsongbpm-${mainArtistName}-${cleanedTrackName}`.toLowerCase();
          
          // Try to get from cache (check all possible keys)
          let cachedBpm = cacheService.get('bpm', acousticbrainzCacheKey) || 
                         cacheService.get('bpm', getsongbpmCacheKey) ||
                         cacheService.get('bpm', legacyCacheKey);
          
          if (cachedBpm && cachedBpm.bpm) {
            bpm = cachedBpm.bpm;
            bpmSource = cachedBpm.source || 'cached';
          } else {
            const bpmResult = await bpmService.fetchBpmWithFallback(cleanedTrackName, mainArtistName);
            if (bpmResult && bpmResult.bpm) {
              bpm = bpmResult.bpm;
              bpmSource = bpmResult.source;
              
              // Cache with source-specific key
              const cacheKey = `${bpmResult.source}-${mainArtistName}-${cleanedTrackName}`.toLowerCase();
              cacheService.set('bpm', cacheKey, { bpm, source: bpmResult.source });
              
              console.log(`[TrackService] Got BPM ${bpm} from ${bpmSource} for next track "${trackName}"`);
            } else if (bpmResult && bpmResult.error) {
              console.warn(`[TrackService] Failed to get BPM for next track "${trackName}":`, bpmResult.error);
              // Cache the failure to avoid repeated lookups
              cacheService.set('bpm', legacyCacheKey, { error: bpmResult.error });
            }
          }
          
          return {
            name: trackName,
            artist: nextTrackRaw.artists.map(artist => artist.name).join(', '),
            bpm: bpm,
            bpmSource: bpmSource,
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