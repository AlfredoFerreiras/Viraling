import { eq, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { withServiceContext } from "@/db/context";
import { sessions, users } from "@/db/schema";
import {
  SESSION_COOKIE,
  generateSessionToken,
  hashSessionToken,
  isExpired,
  sessionExpiry,
  shouldRefresh,
} from "./token";

export type SessionUser = typeof users.$inferSelect;

/**
 * Creates a session for the user and returns the plaintext token (it goes
 * into the cookie) and its expiry. It also takes the chance to clean expired
 * sessions of the same user.
 */
export async function createSession(
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = sessionExpiry();
  await withServiceContext(async (tx) => {
    await tx.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    await tx.insert(sessions).values({
      id: hashSessionToken(token),
      userId,
      expiresAt,
    });
  });
  return { token, expiresAt };
}

/**
 * Validates a token: exists, not expired, and returns the user. If the
 * session is close to expiring it extends it (sliding expiration).
 */
export async function validateSessionToken(
  token: string,
): Promise<{ user: SessionUser; expiresAt: Date } | null> {
  const id = hashSessionToken(token);
  return withServiceContext(async (tx) => {
    const [row] = await tx
      .select({ session: sessions, user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.id, id))
      .limit(1);
    if (!row) return null;

    if (isExpired(row.session.expiresAt)) {
      await tx.delete(sessions).where(eq(sessions.id, id));
      return null;
    }

    let expiresAt = row.session.expiresAt;
    if (shouldRefresh(expiresAt)) {
      expiresAt = sessionExpiry();
      await tx.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    }
    return { user: row.user, expiresAt };
  });
}

export async function invalidateSession(token: string): Promise<void> {
  const id = hashSessionToken(token);
  await withServiceContext((tx) => tx.delete(sessions).where(eq(sessions.id, id)));
}

/** Closes every session of a user (password change, admin). */
export async function invalidateUserSessions(userId: string): Promise<void> {
  await withServiceContext((tx) =>
    tx.delete(sessions).where(eq(sessions.userId, userId)),
  );
}

// ---------- Cookie (only from route handlers / server actions) ----------

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readSessionCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
