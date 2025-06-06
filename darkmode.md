# Dark Mode Implementation Plan

## Overview
Add a dark mode toggle to the Spotify BPM Viewer that provides a modern, eye-friendly dark interface optimized for music listening and BPM analysis, with colors chosen for optimal readability and reduced eye strain.

## Phase 1: Core Dark Mode Infrastructure

### 1.1 Theme System Setup
- Create `src/utils/theme-manager.js` module to handle theme state and persistence
- Add theme detection and system preference integration
- Implement localStorage persistence for user preference
- Create theme switching API with event system

### 1.2 CSS Variables Architecture
- Refactor `style.css` to use CSS custom properties for all colors
- Define light and dark theme color palettes
- Use cyan accent colors optimized for music apps and accessibility
- Ensure proper contrast ratios for accessibility (WCAG AA compliance)

### 1.3 Theme Toggle UI Component
- Add dark mode toggle button to header controls (next to lyrics toggle)
- Design consistent with existing button styles
- Include appropriate icons (sun/moon or light/dark indicators)
- Maintain responsive behavior on mobile

## Phase 2: Visual Design Implementation

### 2.1 Color Palette Definition
**Light Theme (Refined):**
- Background: `#f8fafc`
- Content background: `#ffffff`
- Text primary: `#1e293b`
- Text secondary: `#64748b`
- Accent: `#0891b2` (Cyan - musical, modern, accessible)
- Accent hover: `#0e7490`
- Borders: `#e2e8f0`

**Dark Theme (New):**
- Background: `#0f172a`
- Content background: `#1e293b`
- Text primary: `#f1f5f9`
- Text secondary: `#94a3b8`
- Accent: `#22d3ee` (Bright cyan - optimal contrast on dark)
- Accent hover: `#06b6d4`
- Borders: `#334155`

### 2.2 Color Choice Rationale
**Why Cyan Over Spotify Green:**
- **Musical Context**: Cyan is widely used in audio/music production tools and DJ software
- **Eye Comfort**: Cooler tones reduce eye strain during extended listening sessions
- **Accessibility**: Better contrast ratios in both light and dark themes
- **Modern Appeal**: Fresh, tech-forward feel that doesn't compete with album artwork
- **Versatility**: Works well with various music genres and album art color schemes

### 2.3 Component-Specific Adaptations
- Song info cards: Dark backgrounds with proper contrast
- Lyrics panel: Dark theme with readable text
- Buttons: Maintain hover states and accessibility
- Shadows and borders: Adapt for dark backgrounds
- Album art: Ensure proper contrast frames

## Phase 3: Integration and Polish

### 3.1 Renderer Integration
- Add theme toggle event handler to `renderer.js`
- Integrate with existing localStorage pattern (like lyrics toggle)
- Ensure theme persists across app restarts
- Add smooth transition animations

### 3.2 System Integration
- Detect system dark mode preference on first launch
- Respect user's OS theme setting as default
- Maintain user override preference when explicitly set

### 3.3 Accessibility and UX
- Ensure all text meets WCAG contrast requirements
- Test with screen readers and accessibility tools
- Smooth theme transition animations (0.3s duration)
- Keyboard navigation support for toggle

## Implementation Approach

### File Changes Required:
1. **New file**: `src/utils/theme-manager.js` - Theme state management
2. **Modify**: `style.css` - CSS variables and dark theme rules
3. **Modify**: `index.html` - Add theme toggle button
4. **Modify**: `renderer.js` - Theme toggle functionality
5. **Modify**: `preload.js` - Expose theme APIs if needed

### Key Features:
- **Toggle Persistence**: Theme choice saved in localStorage
- **System Detection**: Respects OS dark mode preference initially
- **Smooth Transitions**: 0.3s CSS transitions for theme switching
- **Accessibility**: Proper contrast ratios and keyboard support
- **User-Optimized Colors**: Cyan accents chosen for musical context and eye comfort

### Success Criteria:
- Theme toggles instantly with smooth transitions
- All text remains readable in both modes
- User preference persists across app sessions
- System theme detection works on first launch
- Mobile responsive behavior maintained
- No accessibility regressions introduced

## Technical Considerations

### CSS Strategy:
- Use `:root` CSS custom properties for theme variables
- Apply `data-theme` attribute to body for theme switching
- Maintain existing transition classes for lyrics panel
- Ensure proper cascading for nested components

### State Management:
- Theme state managed in theme-manager.js singleton
- Events dispatched for theme changes
- Integration with existing localStorage patterns
- No conflicts with current lyrics toggle system

### Performance:
- Minimal impact on app startup time
- CSS variables provide efficient theme switching
- No additional API calls or external dependencies
- Leverage existing electron-store patterns if needed

This plan maintains the app's simplicity while adding a professional dark mode feature that enhances user experience across different lighting conditions and user preferences.