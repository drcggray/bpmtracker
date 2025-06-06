// ABOUTME: Track title cleaning utilities for consistent API lookups
// ABOUTME: Removes common suffixes and annotations that interfere with matching

class TrackCleaner {
  static cleanTrackTitle(title) {
    if (!title) return '';
    let cleanedTitle = title;
    
    cleanedTitle = cleanedTitle.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    cleanedTitle = cleanedTitle.replace(/\s*\[.*?\]\s*/g, ' ').trim();
    
    const suffixesToRemove = [
      '- Remastered Version', '- Remastered', 
      '- Live Version', '- Live', 
      '- Radio Edit', '- Single Version', 
      '- Acoustic Version', '- Acoustic',
      '- Bonus Track'
    ];
    
    suffixesToRemove.forEach(suffix => {
      if (cleanedTitle.toLowerCase().endsWith(suffix.toLowerCase())) {
        cleanedTitle = cleanedTitle.substring(0, cleanedTitle.length - suffix.length);
      }
    });
    
    cleanedTitle = cleanedTitle.trim();
    return cleanedTitle.length > 0 ? cleanedTitle : title;
  }
}

module.exports = TrackCleaner;