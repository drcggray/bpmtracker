# Genius API Lyrics Implementation Plan

## Phase 1: API Research & Configuration
- [x] Research Genius API authentication and endpoint requirements
- [x] Add Genius API configuration to config.json structure
- [x] Design UI layout for lyrics display on right side of screen

## Phase 2: Backend Implementation
- [x] Implement Genius API search and lyrics fetching functions in main.js
- [x] Add IPC handlers for lyrics data communication
- [x] Add error handling for lyrics fetch failures

## Phase 3: Frontend Implementation
- [x] Modify index.html to include lyrics display area
- [x] Update renderer.js to fetch and display lyrics
- [x] Update CSS for responsive layout with lyrics panel

## Phase 4: Enhancement & Optimization
- [x] Implement lyrics caching to reduce API calls
- [x] Add loading states for lyrics fetching
- [x] Test edge cases and error scenarios

## Technical Details

### Genius API Integration
- Uses public search API (no auth required for basic search)
- Requires web scraping for full lyrics (API doesn't provide full lyrics)
- Alternative: Use genius-lyrics npm package for simplified integration

### UI Layout Design
- Split screen: 60% left for current BPM viewer, 40% right for lyrics
- Scrollable lyrics container with fixed header
- Responsive breakpoint: stack vertically on small screens

### Caching Strategy
- Store lyrics in memory with track ID as key
- Optional: Persist to local storage with size limits
- Cache expiry: Keep for session duration

### Error Handling
- "Lyrics not available" message for missing lyrics
- Retry mechanism for network failures
- Fallback to manual search link on Genius