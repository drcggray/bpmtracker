# Spotify BPM Viewer

This Electron application is designed to display information about the currently playing song on Spotify, including its tempo (BPM).

## BPM Feature Status (Important Note - May 2025)

The functionality to display BPM (Beats Per Minute) for tracks is currently **non-operational** due to changes in the Spotify Web API.

*   **Deprecated Endpoint:** The Spotify API endpoint previously used to fetch audio features (including tempo/BPM), `/v1/audio-features/{id}`, was **deprecated as of November 27, 2024.**
*   **Impact:** Applications created or attempting to use this endpoint after this date (without prior approved quota extensions) will receive a `403 Forbidden` error when trying to access this data. This application experiences this 403 error.
*   **Current Status:** As of May 2025, Spotify has not announced a direct official replacement for this deprecated endpoint for general use by new applications.

**Consequence:** This application, in its current state, cannot retrieve or display BPM information directly from the official Spotify Web API due to this deprecation.

**Recommendations for Future Development:**
*   Before attempting to "fix" or re-implement the BPM feature, check the official [Spotify Developer News & Announcements](https://developer.spotify.com/community/news/) for any updates regarding new audio analysis endpoints or alternative methods provided by Spotify.
*   If BPM data is critical, alternative third-party music analysis APIs would need to be investigated and integrated, which would be a significant architectural change.

This note is intended to prevent future development efforts from being spent on troubleshooting access to the deprecated `/v1/audio-features/{id}` endpoint without awareness of its current status.

## Future Development Notes

### Lyrics Feature Planning
**Genius API Research Completed (May 2025):** Investigation into using Genius API as a replacement for GetSongBPM service revealed that while Genius API provides excellent song metadata and lyrics data, it does **not** include BPM/tempo information. The Genius API would be suitable for implementing a future lyrics display feature but cannot replace the current BPM data source.

**Current Plan:** Continue using GetSongBPM.com API for tempo data while searching for alternative tempo/BPM API providers. Genius API integration will be considered for future lyrics display functionality.
