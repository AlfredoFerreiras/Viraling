import { cache } from "react";
import type { users } from "@/db/schema";
import { readSessionCookie, validateSessionToken } from "./session";

export type DbUser = typeof users.$inferSelect;

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

/**
 * Resolves the DB user from the session cookie.
 * Returns null if there is no cookie, or the session does not exist or expired.
 *
 * The role ALWAYS comes from users.role in the DB. Cached per request with
 * React cache(): header, layout and page share a single query.
 */
export const getCurrentUser = cache(async (): Promise<DbUser | null> => {
  const token = await readSessionCookie();
  if (!token) return null;
  const result = await validateSessionToken(token);
  return result?.user ?? null;
});

/** Like getCurrentUser, but throws UnauthorizedError if there is no session. */
export async function requireUser(): Promise<DbUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** Requires an exact role (e.g. requireRole('admin') on admin routes). */
export async function requireRole(role: DbUser["role"]): Promise<DbUser> {
  const user = await requireUser();
  if (user.role !== role) throw new ForbiddenError();
  return user;
}
