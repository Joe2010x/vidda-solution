/**
 * Simple in-memory cache for LLM responses
 * Helps reduce API calls and improve performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class LLMCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate a cache key from parameters
   */
  generateKey(prefix: string, params: any): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    return `${prefix}:${Buffer.from(paramString).toString('base64')}`;
  }

  /**
   * Get an item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set an item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });
  }

  /**
   * Remove an item from cache
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items with a specific prefix
   */
  clearPrefix(prefix: string): void {
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: Array<{ key: string; age: number }> } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
let cacheInstance: LLMCache | null = null;

export function getLLMCache(): LLMCache {
  if (!cacheInstance) {
    cacheInstance = new LLMCache();

    // Run cleanup every minute
    setInterval(() => {
      cacheInstance?.cleanup();
    }, 60 * 1000);
  }

  return cacheInstance;
}

// Cache key prefixes
export const CACHE_KEYS = {
  RISK_ANALYSIS: 'llm:risk-analysis',
  TRAINING_PLAN: 'llm:training-plan',
  VALIDATION: 'llm:validation',
  REVIEW: 'llm:review',
  RAG_EMBEDDING: 'rag:embedding',
};

// Export for testing
export { LLMCache };
