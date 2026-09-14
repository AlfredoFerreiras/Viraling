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
 * Crea una sesión para el usuario y devuelve el token en claro (va a la
 * cookie) y su expiración. Aprovecha para limpiar sesiones vencidas del
 * mismo usuario.
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
 * Valida un token: existe, no venció, y devuelve el usuario. Si la
 * sesión está por vencer la extiende (sliding expiration).
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

/** Cierra todas las sesiones de un usuario (cambio de contraseña, admin). */
export async function invalidateUserSessions(userId: string): Promise<void> {
  await withServiceContext((tx) =>
    tx.delete(sessions).where(eq(sessions.userId, userId)),
  );
}

// ---------- Cookie (solo desde route handlers / server actions) ----------

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
