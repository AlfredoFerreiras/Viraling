import { createHash, randomBytes } from "node:crypto";

/**
 * Helpers puros de sesión (sin DB ni cookies) para poder testearlos.
 *
 * El token que viaja en la cookie es aleatorio (256 bits). En la DB solo
 * se guarda su sha256: si alguien lee la tabla sessions no puede
 * reconstruir cookies válidas.
 */

export const SESSION_COOKIE = "viraling_session";
export const SESSION_DAYS = 30;
/** Si a la sesión le quedan menos de esto, se extiende (sliding). */
export const SESSION_REFRESH_DAYS = 15;

const DAY_MS = 24 * 60 * 60 * 1000;

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + SESSION_DAYS * DAY_MS);
}

export function shouldRefresh(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() - now.getTime() < SESSION_REFRESH_DAYS * DAY_MS;
}

export function isExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
