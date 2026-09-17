import { createHash, randomBytes } from "node:crypto";

/**
 * Pure session helpers (no DB, no cookies) so they can be tested.
 *
 * The token carried in the cookie is random (256 bits). The DB only
 * stores its sha256: someone who reads the sessions table cannot
 * reconstruct valid cookies.
 */

export const SESSION_COOKIE = "viraling_session";
export const SESSION_DAYS = 30;
/** If a session has less than this left, it is extended (sliding). */
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
