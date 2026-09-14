import { describe, expect, it } from "vitest";
import {
  generateSessionToken,
  hashSessionToken,
  isExpired,
  sessionExpiry,
  shouldRefresh,
} from "./token";

const DAY = 24 * 60 * 60 * 1000;

describe("session tokens", () => {
  it("generates unique, url-safe tokens with enough entropy", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(43); // 32 bytes in base64url
  });

  it("hashes deterministically and never stores the raw token", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    expect(hash).toBe(hashSessionToken(token));
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
  });

  it("expires 30 days out and refreshes once under 15 days remain", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const exp = sessionExpiry(now);
    expect(exp.getTime() - now.getTime()).toBe(30 * DAY);
    expect(shouldRefresh(exp, now)).toBe(false);
    expect(shouldRefresh(exp, new Date(now.getTime() + 16 * DAY))).toBe(true);
    expect(isExpired(exp, new Date(now.getTime() + 30 * DAY))).toBe(true);
    expect(isExpired(exp, new Date(now.getTime() + 29 * DAY))).toBe(false);
  });
});
