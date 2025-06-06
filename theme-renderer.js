// ABOUTME: Client-side theme management for the renderer process
// ABOUTME: Handles theme switching, persistence, and system detection in the browser context

class ThemeManager {
  constructor() {
    this.currentTheme = null;
    this.listeners = [];
    this.initialize();
  }

  initialize() {
    // Check for saved theme preference or detect system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      this.currentTheme = savedTheme;
    } else {
      // Detect system preference
      this.currentTheme = this.detectSystemTheme();
    }
    
    this.applyTheme(this.currentTheme);
    this.watchSystemTheme();
    console.log(`[ThemeManager] Initialized with ${this.currentTheme} theme`);
  }

  detectSystemTheme() {
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // Default fallback
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  setTheme(theme) {
    if (!['light', 'dark'].includes(theme)) {
      console.error(`[ThemeManager] Invalid theme: ${theme}`);
      return;
    }

    if (this.currentTheme === theme) {
      return; // No change needed
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
    this.saveTheme(theme);
    this.notifyListeners(theme);
    
    console.log(`[ThemeManager] Theme changed to: ${theme}`);
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  }

  applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
  }

  saveTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('[ThemeManager] Failed to save theme to localStorage:', error);
    }
  }

  addThemeChangeListener(callback) {
    this.listeners.push(callback);
  }

  removeThemeChangeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  notifyListeners(theme) {
    this.listeners.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('[ThemeManager] Error in theme change listener:', error);
      }
    });
  }

  // Listen for system theme changes
  watchSystemTheme() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Only update if user hasn't explicitly set a preference
        const savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
          const systemTheme = e.matches ? 'dark' : 'light';
          this.setTheme(systemTheme);
        }
      });
    }
  }
}

// Create global theme manager instance
window.themeManager = new ThemeManager();