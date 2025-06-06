# Lyrics Toggle Feature Implementation Plan

## Overview
Add a toggle button labeled "Lyrics" at the top right of the screen that shows/hides the lyrics panel with smooth transitions.

## Implementation Steps

### 1. UI Design
- [x] Add "Lyrics" button positioned at top right of main content area
- [x] Style button to match Spotify green theme
- [x] Add hover and active states for better UX

### 2. HTML Structure Updates
- [x] Add lyrics toggle button to index.html
- [x] Ensure button is properly positioned in the layout

### 3. CSS Updates
- [x] Create `.lyrics-hidden` class to hide lyrics panel
- [x] Add smooth CSS transitions for panel sliding
- [x] Update `.app-container` and child elements for dynamic layout
- [x] Ensure main content expands when lyrics are hidden
- [x] Maintain responsive design for mobile

### 4. JavaScript Functionality
- [x] Add click event listener to toggle button
- [x] Implement toggle logic to show/hide lyrics panel
- [x] Update button text/style to indicate current state
- [x] Only fetch lyrics when panel is visible
- [x] Clear lyrics fetch interval when panel is hidden

### 5. State Management
- [x] Store user preference in localStorage
- [x] Restore toggle state on app startup
- [x] Update lyrics fetching based on visibility

### 6. Window Sizing
- [x] Adjust default window width based on toggle state
- [x] Ensure content doesn't feel cramped in either state

## Technical Details

### CSS Transitions
```css
.app-container {
  transition: all 0.3s ease-in-out;
}

.lyrics-panel {
  transition: width 0.3s ease-in-out, opacity 0.3s ease-in-out;
}

.lyrics-panel.lyrics-hidden {
  width: 0;
  opacity: 0;
  overflow: hidden;
}
```

### Toggle Logic
```javascript
function toggleLyrics() {
  const lyricsPanel = document.getElementById('lyrics-panel');
  const isHidden = lyricsPanel.classList.contains('lyrics-hidden');
  
  if (isHidden) {
    lyricsPanel.classList.remove('lyrics-hidden');
    // Start fetching lyrics
  } else {
    lyricsPanel.classList.add('lyrics-hidden');
    // Stop fetching lyrics
  }
  
  // Save preference
  localStorage.setItem('showLyrics', isHidden);
}
```