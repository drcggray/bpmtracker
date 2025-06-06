// ABOUTME: Centralized caching service for application data
// ABOUTME: Provides TTL-based caching with configurable expiration policies

class CacheService {
  constructor() {
    this.caches = {
      lyrics: new Map(),
      bpm: new Map(),
      tracks: new Map()
    };
    this.ttl = {
      lyrics: 24 * 60 * 60 * 1000, // 24 hours
      bpm: 7 * 24 * 60 * 60 * 1000, // 7 days
      tracks: 5 * 60 * 1000 // 5 minutes
    };
  }

  set(cacheType, key, value, customTtl = null) {
    if (!this.caches[cacheType]) {
      console.warn(`[Cache] Unknown cache type: ${cacheType}`);
      return false;
    }

    const ttl = customTtl || this.ttl[cacheType];
    const expiresAt = Date.now() + ttl;
    
    this.caches[cacheType].set(key, {
      value,
      expiresAt
    });

    console.log(`[Cache] Set ${cacheType} cache for key: ${key}`);
    return true;
  }

  get(cacheType, key) {
    if (!this.caches[cacheType]) {
      console.warn(`[Cache] Unknown cache type: ${cacheType}`);
      return null;
    }

    const cached = this.caches[cacheType].get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.caches[cacheType].delete(key);
      console.log(`[Cache] Expired ${cacheType} cache for key: ${key}`);
      return null;
    }

    console.log(`[Cache] Hit ${cacheType} cache for key: ${key}`);
    return cached.value;
  }

  has(cacheType, key) {
    const value = this.get(cacheType, key);
    return value !== null;
  }

  delete(cacheType, key) {
    if (!this.caches[cacheType]) {
      return false;
    }
    
    const deleted = this.caches[cacheType].delete(key);
    if (deleted) {
      console.log(`[Cache] Deleted ${cacheType} cache for key: ${key}`);
    }
    return deleted;
  }

  clear(cacheType) {
    if (cacheType) {
      if (this.caches[cacheType]) {
        this.caches[cacheType].clear();
        console.log(`[Cache] Cleared ${cacheType} cache`);
        return true;
      }
      return false;
    } else {
      Object.keys(this.caches).forEach(type => {
        this.caches[type].clear();
      });
      console.log('[Cache] Cleared all caches');
      return true;
    }
  }

  getStats() {
    const stats = {};
    Object.keys(this.caches).forEach(type => {
      stats[type] = {
        size: this.caches[type].size,
        ttl: this.ttl[type]
      };
    });
    return stats;
  }

  cleanup() {
    Object.keys(this.caches).forEach(cacheType => {
      const cache = this.caches[cacheType];
      const keysToDelete = [];
      
      cache.forEach((cached, key) => {
        if (Date.now() > cached.expiresAt) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => cache.delete(key));
      
      if (keysToDelete.length > 0) {
        console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries from ${cacheType}`);
      }
    });
  }
}

module.exports = new CacheService();