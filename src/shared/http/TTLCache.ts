/**
 * TTL Cache
 * 
 * Simple in-memory cache with:
 * - Time-to-live (TTL) per entry
 * - LRU eviction when max size exceeded
 * - Pattern-based invalidation
 * - Cache key generation helpers
 */

import { getLogger } from "@shared/utils/logger";

const logger = getLogger();

/**
 * Configuration for the TTL cache
 */
export interface TTLCacheConfig {
  /** Default TTL in milliseconds (default: 5 minutes) */
  defaultTTL: number;
  /** Maximum number of entries (default: 100) */
  maxSize: number;
  /** Enable debug logging (default: false) */
  debug: boolean;
}

/**
 * Cache entry with value and metadata
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
  key: string;
}

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: TTLCacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  debug: false,
};

/**
 * Common TTL presets in milliseconds
 */
export const TTL = {
  /** 1 minute */
  SHORT: 1 * 60 * 1000,
  /** 2 minutes */
  MEDIUM: 2 * 60 * 1000,
  /** 5 minutes */
  DEFAULT: 5 * 60 * 1000,
  /** 15 minutes */
  LONG: 15 * 60 * 1000,
  /** 30 minutes */
  VERY_LONG: 30 * 60 * 1000,
  /** No caching */
  NONE: 0,
} as const;

/**
 * TTL Cache with LRU eviction
 * 
 * Thread-safe in-memory cache that automatically expires entries
 * and evicts least-recently-used entries when capacity is reached.
 */
export class TTLCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>>;
  private config: TTLCacheConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<TTLCacheConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();

    // Start periodic cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Get a value from the cache
   * Returns undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.config.debug) {
        logger.debug(`[TTLCache] Miss: ${key}`);
      }
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      if (this.config.debug) {
        logger.debug(`[TTLCache] Expired: ${key}`);
      }
      this.cache.delete(key);
      return undefined;
    }

    // Update last accessed time for LRU
    entry.lastAccessed = Date.now();

    if (this.config.debug) {
      logger.debug(`[TTLCache] Hit: ${key}`);
    }

    return entry.value;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL in milliseconds (uses default if not specified)
   */
  set(key: string, value: T, ttl?: number): void {
    const effectiveTTL = ttl ?? this.config.defaultTTL;

    // Don't cache if TTL is 0
    if (effectiveTTL <= 0) {
      return;
    }

    // Evict if at capacity
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + effectiveTTL,
      lastAccessed: Date.now(),
      key,
    };

    this.cache.set(key, entry);

    if (this.config.debug) {
      logger.debug(`[TTLCache] Set: ${key} (TTL: ${effectiveTTL}ms)`);
    }
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted && this.config.debug) {
      logger.debug(`[TTLCache] Deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Invalidate all entries matching a pattern
   * @param pattern String that cache keys must contain, or RegExp to match against
   */
  invalidateByPattern(pattern: string | RegExp): number {
    let count = 0;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      const matches =
        pattern instanceof RegExp
          ? pattern.test(key)
          : key.includes(pattern);

      if (matches) {
        keysToDelete.push(key);
        count++;
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (this.config.debug && count > 0) {
      logger.debug(`[TTLCache] Invalidated ${count} entries matching: ${pattern}`);
    }

    return count;
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    if (this.config.debug) {
      logger.debug(`[TTLCache] Cleared ${size} entries`);
    }
  }

  /**
   * Get the current number of entries in the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    defaultTTL: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      defaultTTL: this.config.defaultTTL,
    };
  }

  /**
   * Dispose of the cache and stop cleanup interval
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (this.config.debug && expiredCount > 0) {
      logger.debug(`[TTLCache] Cleanup: removed ${expiredCount} expired entries`);
    }
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      if (this.config.debug) {
        logger.debug(`[TTLCache] Evicted LRU: ${oldestKey}`);
      }
    }
  }
}

/**
 * Generate a cache key from multiple parts
 * Useful for creating unique keys based on function name and parameters
 */
export function generateCacheKey(...parts: (string | number | boolean | null | undefined)[]): string {
  return parts
    .map((part) => {
      if (part === null || part === undefined) {
        return "_null_";
      }
      return String(part);
    })
    .join(":");
}

/**
 * Generate a cache key from a GraphQL query
 * Normalizes whitespace and creates a hash
 */
export function generateQueryCacheKey(query: string, variables?: object): string {
  // Normalize whitespace in query
  const normalizedQuery = query.replace(/\s+/g, " ").trim();
  
  // Create a simple hash of the query
  let hash = 0;
  for (let i = 0; i < normalizedQuery.length; i++) {
    const char = normalizedQuery.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const queryKey = `query:${hash}`;

  if (variables && Object.keys(variables).length > 0) {
    return `${queryKey}:${JSON.stringify(variables)}`;
  }

  return queryKey;
}

// Singleton instances for different cache purposes
let apiCache: TTLCache | null = null;
let metadataCache: TTLCache | null = null;

/**
 * Get the shared API response cache
 * Used for caching ticket data, issues, etc.
 */
export function getApiCache(): TTLCache {
  if (!apiCache) {
    apiCache = new TTLCache({
      defaultTTL: TTL.MEDIUM, // 2 minutes for API responses
      maxSize: 200,
      debug: false,
    });
  }
  return apiCache;
}

/**
 * Get the shared metadata cache
 * Used for caching workflow states, users, teams, etc.
 */
export function getMetadataCache(): TTLCache {
  if (!metadataCache) {
    metadataCache = new TTLCache({
      defaultTTL: TTL.LONG, // 15 minutes for metadata
      maxSize: 100,
      debug: false,
    });
  }
  return metadataCache;
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  apiCache?.clear();
  metadataCache?.clear();
}

/**
 * Dispose all cache instances
 */
export function disposeAllCaches(): void {
  apiCache?.dispose();
  metadataCache?.dispose();
  apiCache = null;
  metadataCache = null;
}

