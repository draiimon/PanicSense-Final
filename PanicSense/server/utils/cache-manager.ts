/**
 * Cache Manager Utility
 * 
 * A reusable caching system to reduce API calls and improve performance.
 * This utility provides a simple interface for storing and retrieving cached data
 * with automatic expiration.
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  namespace?: string; // Optional namespace for grouping related cache items
}

class CacheManager {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number; // Default time to live (1 hour)
  
  constructor(defaultTTLMs: number = 60 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLMs;
  }
  
  /**
   * Generate a cache key with optional namespace
   */
  private generateKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }
  
  /**
   * Set data in cache with expiration
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const cacheKey = this.generateKey(key, options.namespace);
    const ttl = options.ttl || this.defaultTTL;
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // Set expiration timeout to automatically clean up expired items
    setTimeout(() => {
      if (this.has(key, options.namespace)) {
        const item = this.cache.get(cacheKey);
        if (item && Date.now() - item.timestamp >= ttl) {
          this.delete(key, options.namespace);
        }
      }
    }, ttl);
  }
  
  /**
   * Get data from cache if it exists and hasn't expired
   */
  get<T>(key: string, options: CacheOptions = {}): T | null {
    const cacheKey = this.generateKey(key, options.namespace);
    const ttl = options.ttl || this.defaultTTL;
    
    if (this.cache.has(cacheKey)) {
      const item = this.cache.get(cacheKey) as CacheItem<T>;
      
      // Check if item has expired
      if (Date.now() - item.timestamp < ttl) {
        return item.data;
      } else {
        // Item expired, remove it
        this.delete(key, options.namespace);
      }
    }
    
    return null;
  }
  
  /**
   * Check if key exists in cache and hasn't expired
   */
  has(key: string, namespace?: string): boolean {
    const cacheKey = this.generateKey(key, namespace);
    return this.cache.has(cacheKey);
  }
  
  /**
   * Delete item from cache
   */
  delete(key: string, namespace?: string): boolean {
    const cacheKey = this.generateKey(key, namespace);
    return this.cache.delete(cacheKey);
  }
  
  /**
   * Get data from cache if available, otherwise execute factory function
   * and cache its result
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }
    
    // Execute factory function to get fresh data
    const data = await factory();
    this.set(key, data, options);
    return data;
  }
  
  /**
   * Clear all items in a namespace or the entire cache
   */
  clear(namespace?: string): void {
    if (namespace) {
      // Only clear items in the specified namespace
      const nsPrefix = `${namespace}:`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(nsPrefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear the entire cache
      this.cache.clear();
    }
  }
  
  /**
   * Get cache stats
   */
  getStats(): { size: number, namespaces: Record<string, number> } {
    const namespaces: Record<string, number> = {};
    
    // Count items per namespace
    for (const key of this.cache.keys()) {
      const parts = key.split(':');
      if (parts.length > 1) {
        const ns = parts[0];
        namespaces[ns] = (namespaces[ns] || 0) + 1;
      } else {
        namespaces['default'] = (namespaces['default'] || 0) + 1;
      }
    }
    
    return {
      size: this.cache.size,
      namespaces
    };
  }
}

// Export a singleton instance
export const cacheManager = new CacheManager();

// Export the class for testing or specific instances
export default CacheManager;