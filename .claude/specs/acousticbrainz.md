# AcousticBrainz Integration Specification

## Overview
Integrate MusicBrainz/AcousticBrainz as the primary BPM data source with GetSongBPM as a fallback when MusicBrainz/AcousticBrainz data is unavailable. This will be implemented without removing or breaking existing GetSongBPM functionality.

## Architecture
1. **MusicBrainz API**: Search for recording MBIDs (MusicBrainz IDs) by artist and track name
2. **AcousticBrainz API**: Fetch acoustic data (including BPM) using MBIDs
3. **Fallback Strategy**: Try MusicBrainz/AcousticBrainz first, then fall back to GetSongBPM

## Implementation Steps

### Step 1: Create MusicBrainz Client Module ✅
**File**: `/src/api/musicbrainz-client.js`

**Requirements**:
- Search endpoint: `https://musicbrainz.org/ws/2/recording`
- Query format: `artist:"${artist}" AND recording:"${track}"`
- Response format: JSON (`fmt=json`)
- Rate limiting: 1 request per second (strict)
- User-Agent header: `SpotifyBPMViewer/1.0 (https://github.com/yourusername/spotify-bpm-viewer)`
- Error handling for network failures and API errors
- Parse search results to extract MBID

**Test Checklist**:
- [ ] Module exports `searchRecording(trackName, artistName)` function
- [ ] Returns MBID for valid searches
- [ ] Handles no results gracefully
- [ ] Respects rate limiting
- [ ] Includes proper User-Agent

### Step 2: Create AcousticBrainz Client Module ✅
**File**: `/src/api/acousticbrainz-client.js`

**Requirements**:
- BPM endpoint: `https://acousticbrainz.org/api/v1/low-level`
- Query parameter: `recording_ids=${mbid}`
- Extract BPM from `rhythm.bpm` field in response
- No authentication required
- Handle cases where data doesn't exist for MBID
- Return null if no BPM data available

**Test Checklist**:
- [ ] Module exports `fetchBpmByMbid(mbid)` function
- [ ] Returns BPM value for valid MBIDs
- [ ] Handles missing data gracefully
- [ ] Parses decimal BPM values correctly

### Step 3: Update Constants ⬜
**File**: `/src/utils/constants.js`

**Requirements**:
- Add MusicBrainz base URL
- Add AcousticBrainz base URL
- Add rate limit constants
- Add User-Agent string

**Test Checklist**:
- [ ] All new constants are properly exported
- [ ] Existing constants remain unchanged

### Step 4: Create BPM Service Abstraction ⬜
**File**: `/src/services/bpm-service.js` (new)

**Requirements**:
- Orchestrate multiple BPM sources
- Implement fallback logic (MusicBrainz/AcousticBrainz first, then GetSongBPM)
- Return source identifier with BPM result
- Maintain consistent interface for track-service

**Test Checklist**:
- [ ] Tries MusicBrainz/AcousticBrainz first
- [ ] Falls back to GetSongBPM when MusicBrainz/AcousticBrainz returns null
- [ ] Returns BPM with source identifier
- [ ] Handles all error cases

### Step 5: Update Track Service ⬜
**File**: `/src/services/track-service.js`

**Requirements**:
- Import new BPM service instead of direct bpm-client
- Update cache key to include source: `${source}-${artistName}-${trackName}`
- Maintain all existing functionality
- Log which source provided the BPM

**Test Checklist**:
- [ ] Existing GetSongBPM functionality still works
- [ ] Fallback to MusicBrainz/AcousticBrainz works
- [ ] Cache works with new key format
- [ ] All existing features remain functional

### Step 6: UI Enhancement ⬜
**File**: `/renderer.js`

**Requirements**:
- Display BPM source indicator (small text or icon)
- Keep existing BPM display format
- Add tooltip showing source on hover

**Test Checklist**:
- [ ] BPM displays correctly from both sources
- [ ] Source indicator is visible but unobtrusive
- [ ] No visual regression in existing UI

### Step 7: Update Tests ⬜
**Files**: Various test files

**Requirements**:
- Add unit tests for new clients
- Update integration tests for track-service
- Add tests for fallback logic
- Ensure all existing tests still pass

**Test Checklist**:
- [ ] All existing tests pass
- [ ] New unit tests for MusicBrainz client
- [ ] New unit tests for AcousticBrainz client
- [ ] Integration tests for fallback logic

### Step 8: Documentation Update ⬜
**Files**: `README.md`, `bpmsources.md`

**Requirements**:
- Document new BPM sources
- Update configuration instructions
- Add troubleshooting section

**Test Checklist**:
- [ ] README reflects new functionality
- [ ] Configuration examples are accurate

## Manual Testing Protocol

Before each git commit, verify:

1. **Basic Functionality**:
   - [ ] App launches without errors
   - [ ] Spotify authentication works
   - [ ] Current track displays correctly
   - [ ] Queue displays correctly

2. **BPM Functionality**:
   - [ ] GetSongBPM still works for tracks with data
   - [ ] Fallback to MusicBrainz/AcousticBrainz works
   - [ ] BPM displays correctly from both sources
   - [ ] No console errors in browser tools

3. **Performance**:
   - [ ] No noticeable slowdown
   - [ ] Rate limiting is respected
   - [ ] Cache prevents redundant API calls

4. **Error Handling**:
   - [ ] App handles API failures gracefully
   - [ ] No crashes when BPM unavailable
   - [ ] Error messages are user-friendly

## Browser Console Checks

Use MCP browser tools to verify:
- No JavaScript errors
- No failed network requests (except expected 404s)
- No performance warnings
- Proper API response handling

## Git Commit Strategy

After each step completion:
1. Run all manual tests
2. Check browser console with MCP tools
3. Create descriptive commit message
4. Mark step as complete (⬜ → ✅)

## Rollback Plan

If issues arise:
1. Git revert to last working commit
2. Identify root cause
3. Fix and retest before proceeding

## Success Criteria

- All existing functionality remains intact
- BPM coverage increases significantly
- No performance degradation
- Clean error handling
- Well-documented code