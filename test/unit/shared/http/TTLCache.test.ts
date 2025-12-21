/**
 * TTL Cache Unit Tests
 *
 * Tests for the time-to-live cache with LRU eviction.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  TTLCache,
  TTL,
  generateCacheKey,
  generateQueryCacheKey,
} from "@shared/http/TTLCache";

describe("TTLCache", () => {
  let cache: TTLCache<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new TTLCache<string>({
      defaultTTL: 60000, // 1 minute
      maxSize: 5,
      debug: false,
    });
  });

  afterEach(() => {
    cache.dispose();
    vi.useRealTimers();
  });

  describe("get/set operations", () => {
    it("should store and retrieve a value", () => {
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
    });

    it("should return undefined for non-existent key", () => {
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("should overwrite existing values", () => {
      cache.set("key1", "value1");
      cache.set("key1", "value2");
      expect(cache.get("key1")).toBe("value2");
    });

    it("should track cache size", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      expect(cache.size).toBe(2);
    });
  });

  describe("TTL expiration", () => {
    it("should expire entries after TTL", () => {
      cache.set("key1", "value1", 1000); // 1 second TTL

      expect(cache.get("key1")).toBe("value1");

      // Advance time past TTL
      vi.advanceTimersByTime(1500);

      expect(cache.get("key1")).toBeUndefined();
    });

    it("should not expire entries before TTL", () => {
      cache.set("key1", "value1", 1000);

      vi.advanceTimersByTime(500); // Half the TTL

      expect(cache.get("key1")).toBe("value1");
    });

    it("should use default TTL when not specified", () => {
      cache.set("key1", "value1");

      vi.advanceTimersByTime(30000); // Half of default (60s)
      expect(cache.get("key1")).toBe("value1");

      vi.advanceTimersByTime(35000); // Past default TTL
      expect(cache.get("key1")).toBeUndefined();
    });

    it("should not cache when TTL is 0", () => {
      cache.set("key1", "value1", 0);
      expect(cache.get("key1")).toBeUndefined();
      expect(cache.size).toBe(0);
    });
  });

  describe("has operation", () => {
    it("should return true for existing, non-expired key", () => {
      cache.set("key1", "value1");
      expect(cache.has("key1")).toBe(true);
    });

    it("should return false for non-existent key", () => {
      expect(cache.has("nonexistent")).toBe(false);
    });

    it("should return false for expired key", () => {
      cache.set("key1", "value1", 1000);
      vi.advanceTimersByTime(1500);
      expect(cache.has("key1")).toBe(false);
    });
  });

  describe("delete operation", () => {
    it("should delete an existing key", () => {
      cache.set("key1", "value1");
      const deleted = cache.delete("key1");

      expect(deleted).toBe(true);
      expect(cache.get("key1")).toBeUndefined();
    });

    it("should return false when deleting non-existent key", () => {
      const deleted = cache.delete("nonexistent");
      expect(deleted).toBe(false);
    });
  });

  describe("LRU eviction", () => {
    it("should evict least recently used entry when at capacity", () => {
      // Fill cache to capacity
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");
      cache.set("key4", "value4");
      cache.set("key5", "value5");

      expect(cache.size).toBe(5);

      // Access key2, key3, key4, key5 to make them recently used
      // key1 becomes the LRU entry
      cache.get("key2");
      cache.get("key3");
      cache.get("key4");
      cache.get("key5");

      // Add new entry, should evict key1 (LRU)
      cache.set("key6", "value6");

      expect(cache.size).toBe(5);
      expect(cache.get("key1")).toBeUndefined(); // Evicted (was LRU)
      expect(cache.get("key2")).toBe("value2"); // Still exists
      expect(cache.get("key6")).toBe("value6"); // New entry exists
    });
  });

  describe("invalidateByPattern", () => {
    it("should invalidate entries matching string pattern", () => {
      cache.set("user:123", "value1");
      cache.set("user:456", "value2");
      cache.set("post:789", "value3");

      const count = cache.invalidateByPattern("user:");

      expect(count).toBe(2);
      expect(cache.get("user:123")).toBeUndefined();
      expect(cache.get("user:456")).toBeUndefined();
      expect(cache.get("post:789")).toBe("value3");
    });

    it("should invalidate entries matching RegExp pattern", () => {
      cache.set("user:123", "value1");
      cache.set("user:456", "value2");
      cache.set("post:789", "value3");

      const count = cache.invalidateByPattern(/user:\d+/);

      expect(count).toBe(2);
    });

    it("should return 0 when no entries match", () => {
      cache.set("key1", "value1");
      const count = cache.invalidateByPattern("nonexistent");
      expect(count).toBe(0);
    });
  });

  describe("clear operation", () => {
    it("should remove all entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.get("key1")).toBeUndefined();
    });
  });

  describe("getStats", () => {
    it("should return cache statistics", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
      expect(stats.defaultTTL).toBe(60000);
    });
  });
});

describe("TTL presets", () => {
  it("should have correct preset values", () => {
    expect(TTL.SHORT).toBe(60000); // 1 minute
    expect(TTL.MEDIUM).toBe(120000); // 2 minutes
    expect(TTL.DEFAULT).toBe(300000); // 5 minutes
    expect(TTL.LONG).toBe(900000); // 15 minutes
    expect(TTL.VERY_LONG).toBe(1800000); // 30 minutes
    expect(TTL.NONE).toBe(0);
  });
});

describe("generateCacheKey", () => {
  it("should join parts with colons", () => {
    const key = generateCacheKey("user", 123, "profile");
    expect(key).toBe("user:123:profile");
  });

  it("should handle null and undefined values", () => {
    const key = generateCacheKey("user", null, undefined, "data");
    expect(key).toBe("user:_null_:_null_:data");
  });

  it("should handle boolean values", () => {
    const key = generateCacheKey("feature", true, false);
    expect(key).toBe("feature:true:false");
  });

  it("should handle single part", () => {
    const key = generateCacheKey("single");
    expect(key).toBe("single");
  });
});

describe("generateQueryCacheKey", () => {
  it("should generate key from query", () => {
    const query = "query { users { id name } }";
    const key = generateQueryCacheKey(query);

    expect(key).toMatch(/^query:-?\d+$/);
  });

  it("should normalize whitespace in query", () => {
    const query1 = "query { users { id } }";
    const query2 = "query  {  users  {  id  }  }";

    const key1 = generateQueryCacheKey(query1);
    const key2 = generateQueryCacheKey(query2);

    expect(key1).toBe(key2);
  });

  it("should include variables in key when provided", () => {
    const query = "query { user(id: $id) { name } }";
    const key = generateQueryCacheKey(query, { id: "123" });

    expect(key).toContain('{"id":"123"}');
  });

  it("should not include variables when empty object", () => {
    const query = "query { users { id } }";
    const key = generateQueryCacheKey(query, {});

    expect(key).not.toContain("{}");
  });
});

