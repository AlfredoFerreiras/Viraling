import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Redis.fromEnv() lee UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

/** 5 requests de IA por minuto por userId (sección 7.3). */
export const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "rl:ai",
});

/** 20 requests por minuto por IP a endpoints de IA. */
export const ipLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:ip",
});

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/** Respuesta 429 estándar con Retry-After en segundos. */
export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests, please try again in a moment" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

/**
 * Aplica ambos limiters a un endpoint de IA. Devuelve null si pasa,
 * o la respuesta 429 lista para retornar.
 *
 * Uso al inicio del handler (después de la sesión, antes de todo lo demás):
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
