import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { MemoryLimiter, type LimitResult } from "./memory-limiter";

/**
 * Rate limiting (section 7.3.4).
 *
 * Distributed with Upstash Redis when UPSTASH_REDIS_REST_URL/TOKEN are
 * defined. If Redis is not configured or fails, it falls back to an
 * in-memory sliding window (per instance) and warns on the console: a
 * provider outage degrades protection, it never takes the app down. The
 * hard spend ceiling is still the credit ledger, which does not need Redis.
 */

function connectRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    return Redis.fromEnv({ retry: { retries: 1, backoff: () => 200 } });
  } catch {
    return null;
  }
}

const redis = connectRedis();
let warnedFallback = false;

const DURATION_MS: Record<Duration, number> = {} as Record<Duration, number>;
function durationToMs(d: Duration): number {
  if (DURATION_MS[d]) return DURATION_MS[d];
  const [n, unit] = d.split(" ");
  const mult = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 1000;
  return (DURATION_MS[d] = Number(n) * mult);
}

class Limiter {
  private readonly remote: Ratelimit | null;
  private readonly local: MemoryLimiter;

  constructor(prefix: string, max: number, window: Duration) {
    this.remote = redis
      ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(max, window), prefix })
      : null;
    this.local = new MemoryLimiter(max, durationToMs(window));
  }

  async limit(key: string): Promise<LimitResult> {
    if (this.remote) {
      try {
        const r = await this.remote.limit(key);
        return { success: r.success, reset: r.reset };
      } catch (err) {
        if (!warnedFallback) {
          warnedFallback = true;
          console.warn(
            "[rate-limit] Upstash unreachable, falling back to in-memory limits:",
            err instanceof Error ? err.message : err,
          );
        }
      }
    }
    return this.local.limit(key);
  }
}

/** 5 AI requests per minute per userId (section 7.3). */
export const aiLimiter = new Limiter("rl:ai", 5, "1 m");

/** 20 requests per minute per IP on AI endpoints. */
export const ipLimiter = new Limiter("rl:ip", 20, "1 m");

/** Account sign-ups: 5 per hour per IP (no email verification). */
export const signUpLimiter = new Limiter("rl:signup", 5, "1 h");

/** Login attempts: 10 per 10 minutes per IP+email (brute force). */
export const signInLimiter = new Limiter("rl:signin", 10, "10 m");

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/** Standard 429 response with Retry-After in seconds. */
export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests, please try again in a moment" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

/**
 * Aplica ambos limiters a un endpoint de IA. Devuelve null si pasa,
 * or the 429 response ready to be returned.
 *
 * Use at the top of the handler (after the session, before everything else):
 *   const limited = await enforceAiRateLimit(req, user.id);
 *   if (limited) return limited;
 */
export async function enforceAiRateLimit(
  req: Request,
  userId: string,
): Promise<NextResponse | null> {
  const [byUser, byIp] = await Promise.all([
    aiLimiter.limit(userId),
    ipLimiter.limit(getClientIp(req)),
  ]);
  if (!byUser.success) return rateLimitResponse(byUser.reset);
  if (!byIp.success) return rateLimitResponse(byIp.reset);
  return null;
}
