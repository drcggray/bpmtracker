# GetSongBPM API Integration Fix Specification

## Overview
Fix the GetSongBPM API integration to work as a reliable fallback BPM source while maintaining all existing app functionality. The primary issue is the missing mandatory backlink requirement and potential Cloudflare blocking.

## Architecture Preservation
- **DO NOT BREAK**: Existing MusicBrainz/AcousticBrainz integration (primary BPM source)
- **DO NOT BREAK**: Spotify authentication and track fetching
- **DO NOT BREAK**: Current UI functionality, themes, or lyrics features
- **DO NOT BREAK**: Existing caching mechanisms
- **MAINTAIN**: All existing error handling and fallback logic

## Implementation Plan

### Phase 1: Implement Mandatory Backlink ✅
**Objective**: Create publicly accessible GetSongBPM backlink to enable API access

#### Step 1.1: Create Public Backlink HTML Page ✅
- **File**: `/getsongbpm-backlink.html`
- **Action**: Create separate HTML page with required backlink
- **Format**: `<a href="https://getsongbpm.com" target="_blank" rel="dofollow noopener">BPM data provided by GetSongBPM.com</a>`
- **Purpose**: Provides publicly accessible URL for GetSongBPM API registration
- **Note**: Backlink must be on public webpage, NOT in Electron app interface

#### Step 1.2: Remove App Backlink (Corrected Approach) ✅
- **Files**: `/index.html`, `/style.css`
- **Action**: Remove backlink from Electron app interface
- **Reason**: GetSongBPM requires backlink on public webpage, not in app UI
- **Result**: Clean app interface, separate public backlink page

#### Step 1.3: Manual Testing ✅
- **Actions**:
  - Start app with `npm start`
  - Verify app works normally (no backlink in app)
  - Open `getsongbpm-backlink.html` in browser
  - Check backlink opens GetSongBPM.com in new tab
  - Ensure no visual regression in main UI

#### Step 1.4: Browser Console Verification ⬜
- **MCP Tools**: Use `mcp__browser-tools__getConsoleErrors` and `mcp__browser-tools__getConsoleLogs`
- **Verify**: No JavaScript errors introduced
- **Check**: App functionality remains intact

#### Step 1.5: Repository Decision & Git Commit ✅
- **Decision**: Existing GitHub Pages backlink found at `https://drcggray.github.io/bpmtracker/`
- **Result**: No separate repo needed - backlink already exists and is publicly accessible
- **Backlink Text**: "Our BPM data service is proudly powered by GetSongBPM.com"
- **Status**: Ready for GetSongBPM API registration and testing

---

### Phase 2: Fix GetSongBPM API Technical Issues ⬜
**Objective**: Resolve API blocking and improve error handling

#### Step 2.1: Test Current API After Backlink ⬜
- **File**: Test existing `/src/api/bpm-client.js`
- **Action**: Manual testing to see if backlink resolves 403 errors
- **Method**: Try BPM lookup for known songs

#### Step 2.2: Debug and Fix API Issues ⬜
- **File**: `/src/api/bmp-client.js`
- **Potential Fixes**:
  - Add proper referrer headers
  - Update User-Agent string with backlink reference
  - Implement retry logic for rate limiting
  - Handle Cloudflare challenges gracefully
- **Preserve**: All existing error handling logic

#### Step 2.3: Enhance Error Handling ⬜
- **File**: `/src/api/bpm-client.js`
- **Action**: Distinguish between:
  - API access denied (403 - missing backlink)
  - API rate limiting (429)
  - No results found (200 but empty)
  - Network failures
- **Maintain**: Existing fallback behavior

#### Step 2.4: Manual Testing ⬜
- **Test Cases**:
  - Popular songs (e.g., "Bohemian Rhapsody" by Queen)
  - Obscure songs (fallback testing)
  - Songs that should trigger GetSongBPM fallback
- **Verify**: BPM data retrieval works correctly

#### Step 2.5: Browser Console Verification ⬜
- **MCP Tools**: Use browser tools to monitor network requests
- **Check**: Successful API calls to GetSongBPM
- **Verify**: No 403 or other blocking errors

#### Step 2.6: Git Commit ⬜
- **Action**: Commit API fixes
- **Message**: "Fix GetSongBPM API connectivity and error handling"

---

### Phase 3: Enhance Integration & User Experience ⬜
**Objective**: Improve fallback logic and source attribution

#### Step 3.1: Verify Source Attribution Display ⬜
- **File**: `/renderer.js`
- **Check**: Current UI shows source indicators (MB, GSB, etc.)
- **Ensure**: GetSongBPM source properly identified in UI

#### Step 3.2: Optimize Fallback Logic ⬜
- **File**: `/src/services/bmp-service.js`
- **Review**: Current fallback sequence
- **Enhance**: Error handling between sources
- **Maintain**: MusicBrainz/AcousticBrainz as primary

#### Step 3.3: Cache Management Review ⬜
- **File**: `/src/services/track-service.js`
- **Verify**: Caching works with source-specific keys
- **Check**: No cache conflicts between BPM sources
- **Maintain**: Existing cache behavior

#### Step 3.4: Manual Testing ⬜
- **Test Scenarios**:
  - Songs found in MusicBrainz/AcousticBrainz only
  - Songs found in GetSongBPM only
  - Songs found in both sources
  - Songs found in neither source
- **Verify**: Proper source attribution in UI

#### Step 3.5: Browser Console Verification ⬜
- **MCP Tools**: Monitor console during fallback scenarios
- **Check**: No errors during source switching
- **Verify**: Proper logging of BPM source selection

#### Step 3.6: Git Commit ⬜
- **Action**: Commit integration improvements
- **Message**: "Enhance BPM source fallback logic and attribution"

---

### Phase 4: Comprehensive Testing ⬜
**Objective**: Ensure robust operation and test coverage

#### Step 4.1: Unit Tests for GetSongBPM Client ⬜
- **File**: Create/update test files in `/tests/`
- **Coverage**:
  - Successful BPM retrieval
  - Error handling scenarios
  - Response parsing
  - Rate limiting behavior

#### Step 4.2: Integration Tests for BPM Service ⬜
- **File**: Update BPM service tests
- **Coverage**:
  - Full fallback chain operation
  - Source preference logic
  - Error propagation
  - Cache integration

#### Step 4.3: End-to-End Tests ⬜
- **File**: E2E test scenarios
- **Coverage**:
  - Complete user workflow
  - UI updates with BPM data
  - Error states in UI
  - Source attribution display

#### Step 4.4: Error Scenario Testing ⬜
- **Test Cases**:
  - Network failures
  - Invalid API responses
  - Rate limiting
  - No results scenarios

#### Step 4.5: Run Complete Test Suite ⬜
- **Action**: `npm test` or equivalent
- **Verify**: All tests pass
- **Check**: No regression in existing functionality

#### Step 4.6: Final Integration Test ⬜
- **Manual Testing**: Complete user workflow
- **Browser Console**: Final verification of no errors
- **Performance**: Ensure no degradation

#### Step 4.7: Final Git Commit ⬜
- **Action**: Commit all test additions
- **Message**: "Add comprehensive tests for GetSongBPM integration"

---

## Success Criteria

### Functional Requirements ✅
- [ ] GetSongBPM API calls succeed (no 403 errors)
- [ ] BPM data retrieval works for test songs
- [ ] Fallback from MusicBrainz/AcousticBrainz to GetSongBPM works
- [ ] Source attribution displays correctly in UI
- [ ] All existing functionality remains intact

### Technical Requirements ✅
- [ ] Mandatory backlink visible in public GitHub repository
- [ ] Proper error handling for all failure scenarios
- [ ] No JavaScript console errors
- [ ] No visual regression in UI
- [ ] Comprehensive test coverage

### Process Requirements ✅
- [ ] Manual testing completed for each phase
- [ ] Browser console verified after each change
- [ ] Git commits made after successful testing
- [ ] All steps marked as completed (⬜ → ✅)

## Testing Protocol

### Before Each Git Commit
1. **Functional Test**: Start app, test core functionality
2. **BPM Test**: Try BPM lookup for known songs
3. **Browser Console**: Use MCP tools to check for errors
4. **UI Verification**: Ensure no visual regressions
5. **Network Monitoring**: Verify API calls work correctly

### MCP Browser Tools Usage
- `mcp__browser-tools__getConsoleErrors`: Check for JavaScript errors
- `mcp__browser-tools__getConsoleLogs`: Monitor application logs
- `mcp__browser-tools__getNetworkLogs`: Monitor API requests
- `mcp__browser-tools__takeScreenshot`: Document UI state when needed

## Rollback Plan
If any step breaks existing functionality:
1. Immediately git revert to last working commit
2. Identify root cause of the issue
3. Fix the issue while preserving functionality
4. Re-test thoroughly before proceeding

## Notes
- This specification prioritizes maintaining existing functionality above all else
- Each phase builds incrementally on previous phases
- Manual testing and MCP browser verification are mandatory before each commit
- The GetSongBPM integration is secondary to the working MusicBrainz/AcousticBrainz system