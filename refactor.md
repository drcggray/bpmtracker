# Refactoring Plan for Spotify BPM Viewer

## Current Issues
- **Single massive file**: main.js is 690 lines with mixed concerns
- **No separation of concerns**: Authentication, API calls, and business logic all intermingled
- **Hard-coded configuration**: Magic numbers and URLs scattered throughout
- **No error boundaries**: Limited error handling and recovery
- **No tests**: Zero test coverage as noted in CLAUDE.md requirements

## Proposed Modular Architecture

### 1. Core Modules (`/src/`)
```
src/
├── auth/
│   ├── spotify-auth.js      # OAuth flow, token management
│   └── auth-server.js       # HTTP callback server
├── api/
│   ├── spotify-client.js    # Spotify API wrapper
│   ├── bpm-client.js        # GetSongBPM API calls
│   └── lyrics-client.js     # Genius API calls
├── services/
│   ├── track-service.js     # Business logic for track data
│   └── cache-service.js     # Caching layer
├── utils/
│   ├── config-loader.js     # Configuration management
│   ├── track-cleaner.js     # Title cleaning utilities
│   └── constants.js         # App constants
└── main/
    ├── window-manager.js    # Electron window management
    └── ipc-handlers.js      # IPC communication
```

### 2. Configuration (`/config/`)
- Move all constants to dedicated config files
- Environment-based configuration support
- Validation for required API keys

### 3. Testing (`/tests/`)
- Unit tests for each module
- Integration tests for API clients
- End-to-end tests for complete workflows
- Mock implementations for external APIs

## Refactoring Strategy

### Phase 1: Extract Core Services
1. **Config Management**: Extract configuration loading and validation
2. **API Clients**: Create dedicated clients for each external API
3. **Authentication**: Separate OAuth flow from main process

### Phase 2: Business Logic Separation
1. **Track Service**: Centralize track data processing and BPM fetching
2. **Cache Service**: Abstract caching logic with configurable strategies
3. **Data Cleaning**: Isolate title cleaning and validation utilities

### Phase 3: Infrastructure & Testing
1. **IPC Layer**: Clean separation of main/renderer communication
2. **Error Handling**: Consistent error boundaries and recovery
3. **Test Suite**: Comprehensive test coverage following TDD principles

## Key Benefits
- **Maintainability**: Single responsibility per module
- **Testability**: Easy to mock and test individual components
- **Extensibility**: Simple to add new BPM sources or features
- **Reliability**: Better error handling and recovery mechanisms
- **Performance**: Optimized caching and API call patterns

## Implementation Approach
- Maintain all existing functionality
- Incremental migration with git commits at each step
- Backwards compatibility throughout transition
- Follow your style guidelines and minimal change principle

## File-by-File Migration Plan

### Phase 1 Files (Core Services)
1. `src/utils/config-loader.js` - Extract config loading from main.js:15-45
2. `src/auth/spotify-auth.js` - Extract OAuth logic from main.js:483-505
3. `src/auth/auth-server.js` - Extract HTTP server from main.js:422-481
4. `src/api/spotify-client.js` - Extract Spotify API calls from main.js:317-398
5. `src/api/bpm-client.js` - Extract GetSongBPM logic from main.js:108-196
6. `src/api/lyrics-client.js` - Extract Genius logic from main.js:263-314

### Phase 2 Files (Business Logic)
7. `src/utils/track-cleaner.js` - Extract cleaning functions from main.js:80-106
8. `src/services/cache-service.js` - Extract caching logic from main.js:77-78
9. `src/services/track-service.js` - Extract track processing business logic
10. `src/utils/constants.js` - Extract all constants and magic numbers

### Phase 3 Files (Infrastructure)
11. `src/main/window-manager.js` - Extract window management from main.js:507-542
12. `src/main/ipc-handlers.js` - Extract IPC handlers from main.js:544-689
13. `tests/` directory structure with comprehensive test suite
14. Updated main.js as orchestrator importing all modules

## Success Criteria
- All existing functionality preserved
- Main.js reduced to < 100 lines as orchestrator
- 100% test coverage achieved
- No breaking changes to UI or user experience
- Clean git history with logical commits