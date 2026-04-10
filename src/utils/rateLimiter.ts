/**
 * Rate Limiter Utility
 * Implements client-side rate limiting for API calls
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiterConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig = { maxAttempts: 5, windowMs: 60000 }) {
    this.config = config;
    this.startCleanup();
  }

  /**
   * Check if a request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    // If no entry exists or window has expired, create new entry
    if (!entry || now > entry.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    // Increment count if within limit
    if (entry.count < this.config.maxAttempts) {
      entry.count++;
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Get remaining attempts for a key
   */
  getRemaining(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return this.config.maxAttempts;
    if (Date.now() > entry.resetTime) return this.config.maxAttempts;
    return Math.max(0, this.config.maxAttempts - entry.count);
  }

  /**
   * Get reset time in milliseconds for a key
   */
  getResetTime(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return 0;
    const remaining = entry.resetTime - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Reset limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Cleanup expired entries periodically
   */
  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetTime) {
          this.store.delete(key);
        }
      }
    }, this.config.windowMs);
  }
}

// Create global rate limiters for different operations
export const reportSubmissionLimiter = new RateLimiter({
  maxAttempts: 10,
  windowMs: 3600000, // 1 hour
});

export const apiCallLimiter = new RateLimiter({
  maxAttempts: 30,
  windowMs: 60000, // 1 minute
});

export const loginAttemptLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 900000, // 15 minutes
});

/**
 * Hook-like function for rate limiting in React components
 */
export const useRateLimiter = (config: RateLimiterConfig) => {
  const limiter = new RateLimiter(config);

  return {
    isAllowed: (key: string) => limiter.isAllowed(key),
    getRemaining: (key: string) => limiter.getRemaining(key),
    getResetTime: (key: string) => limiter.getResetTime(key),
    reset: (key: string) => limiter.reset(key),
  };
};
