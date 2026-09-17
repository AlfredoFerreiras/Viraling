/**
 * In-memory sliding window. This is the rate limiting fallback when
 * Upstash is not configured or does not respond: it protects per server
 * instance (not across instances), which is enough that a Redis outage
 * never takes the app down. The hard cost ceiling is still the credit
 * ledger.
 */
export type LimitResult = { success: boolean; reset: number };

export class MemoryLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly maxKeys = 10_000,
  ) {}

  limit(key: string, now: number = Date.now()): LimitResult {
    const since = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > since);

    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return { success: false, reset: recent[0] + this.windowMs };
    }

    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > this.maxKeys) this.prune(since);
    return { success: true, reset: now + this.windowMs };
  }

  private prune(since: number): void {
    for (const [key, times] of this.hits) {
      if (times.every((t) => t <= since)) this.hits.delete(key);
    }
  }
}
