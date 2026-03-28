export class RateLimiter {
  constructor(state) {
    this.state = state;
    this.blocked = new Map(); // { ip: timestamp }
  }

  async checkRateLimit(ip, maxRequests, timeWindow) {
    const now = Date.now();
    const key = `rate_limit:${ip}`;
    const stored = await this.state.storage.get(key) || { count: 0, lastRequest: now };

    // Reset count if outside the time window
    if (now - stored.lastRequest > timeWindow) {
      stored.count = 0;
      stored.lastRequest = now;
    }

    // Increment count
    stored.count += 1;

    // Check if limit is exceeded
    if (stored.count > maxRequests) {
      this.blocked.set(ip, now);
      return { allowed: false, retryAfter: timeWindow - (now - stored.lastRequest) };
    }

    // Save the updated state
    await this.state.storage.put(key, stored);
    return { allowed: true };
  }
}
