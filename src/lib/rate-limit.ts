import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { MemoryLimiter, type LimitResult } from "./memory-limiter";

/**
 * Rate limiting (sección 7.3.4).
 *
 * Distribuido con Upstash Redis cuando UPSTASH_REDIS_REST_URL/TOKEN están
 * definidos. Si Redis no está configurado o falla, cae a un sliding
 * window en memoria (por instancia) y avisa por consola: una caída del
 * proveedor degrada la protección, nunca tumba la app. El tope duro de
 * gasto sigue siendo el ledger de créditos, que no depende de Redis.
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

/** 5 requests de IA por minuto por userId (sección 7.3). */
export const aiLimiter = new Limiter("rl:ai", 5, "1 m");

/** 20 requests por minuto por IP a endpoints de IA. */
export const ipLimiter = new Limiter("rl:ip", 20, "1 m");

/** Registro de cuentas: 5 por hora por IP (sin verificación de email). */
export const signUpLimiter = new Limiter("rl:signup", 5, "1 h");

/** Intentos de login: 10 por 10 minutos por IP+email (fuerza bruta). */
export const signInLimiter = new Limiter("rl:signin", 10, "10 m");

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
