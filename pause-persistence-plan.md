# Pause Persistence Plan

## Problem Analysis
Currently when Spotify is paused, the app displays dashes ("--") because:

1. **Line 37 in track-service.js**: `if (playbackState.is_playing && playbackState.item)` - Only shows track info when `is_playing` is true
2. **Line 72**: When paused, it returns `{ name: 'Nothing actively playing.', artist: '', bpm: 'N/A', albumArt: null }`
3. **Renderer shows dashes**: When track name is empty, the UI displays "--"

## Solution Strategy

### Phase 1: Track Service Enhancement
**Goal**: Modify track service to persist the last playing track when paused

**Changes needed**:
1. **Separate playing state from track data**: Check if `playbackState.item` exists regardless of `is_playing` status
2. **Add last track caching**: Store the most recent track info in a "last-played" cache
3. **Fallback logic**: When no track is currently loaded, return the last played track with a paused indicator

### Phase 2: UI Enhancement
**Goal**: Show paused state visually while keeping track info

**Changes needed**:
1. **Add paused indicator**: Show "⏸️" or "(Paused)" next to track name when not playing
2. **Keep lyrics visible**: Don't clear lyrics when paused
3. **Subtle visual cue**: Maybe slightly fade the current song info when paused

### Phase 3: Cache Strategy
**Goal**: Ensure last-played track persists across app restarts

**Changes needed**:
1. **Persistent storage**: Save last track to cache with longer TTL
2. **App startup**: Load last-played track on app start if no current track
3. **Smart clearing**: Only clear when user explicitly changes tracks or logs out

## Implementation Details

### Track Service Logic Changes:
```javascript
// Current logic (line 37):
if (playbackState.is_playing && playbackState.item) {
  // Process track...
}

// New logic:
if (playbackState.item) {
  // Process track...
  // Cache as last-played
  // Return with is_playing status
} else {
  // Try to get last-played from cache
  // Return with paused indicator
}
```

### Cache Structure:
```javascript
{
  name: "Song Name",
  artist: "Artist Name", 
  bpm: "120",
  albumArt: "url",
  is_playing: false,
  last_played_at: timestamp
}
```

### UI Changes:
- Track name display: "Song Name ⏸️" when paused
- Keep all info visible (artist, BPM, album art, lyrics)
- Subtle opacity change or border to indicate paused state

## Benefits:
1. **Better UX**: No jarring disappearance of track info
2. **Lyrics persistence**: Can keep reading lyrics while paused
3. **Quick resume context**: Easy to see what was playing
4. **Natural behavior**: Matches user expectations from other music apps

## Success Criteria:
- ✅ Track info remains visible when Spotify is paused
- ✅ Clear visual indication of paused state (⏸️ emoji + visual styling)
- ✅ Lyrics stay visible during pause
- ✅ Last track persists across app restarts (7-day cache)
- ✅ Normal behavior when actually changing tracks
- ✅ No impact on current authentication flow
- ✅ Smart cache clearing on logout/auth failure

## Implementation Complete ✅

### Phase 1: Track Service Enhancement ✅
- ✅ **Separate playing state from track data**: Modified track-service.js line 33 to check `playbackState.item` regardless of `is_playing`
- ✅ **Add last track caching**: Added `lastPlayed` cache type with 7-day TTL
- ✅ **Fallback logic**: Returns cached last-played track when no current track, with `is_playing: false`

### Phase 2: UI Enhancement ✅
- ✅ **Add paused indicator**: Shows ⏸️ emoji next to track name when paused
- ✅ **Keep lyrics visible**: Only fetches new lyrics on actual song changes, not play/pause
- ✅ **Visual feedback**: Opacity change (0.85) and colored border (gray/cyan) for paused state

### Phase 3: Cache Strategy ✅
- ✅ **Persistent storage**: Last-played cached for 7 days across app restarts
- ✅ **Smart clearing**: Cache cleared on logout and auth failures
- ✅ **Smooth transitions**: CSS transitions for all visual state changes