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
 * Resuelve el usuario de la DB desde la cookie de sesión.
 * Devuelve null si no hay cookie, la sesión no existe o venció.
 *
 * El rol SIEMPRE sale de users.role en la DB. Cacheado por request con
 * React cache(): header, layout y página comparten una sola consulta.
 */
export const getCurrentUser = cache(async (): Promise<DbUser | null> => {
  const token = await readSessionCookie();
  if (!token) return null;
  const result = await validateSessionToken(token);
  return result?.user ?? null;
});

/** Como getCurrentUser, pero lanza UnauthorizedError si no hay sesión. */
export async function requireUser(): Promise<DbUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** Exige un rol exacto (p. ej. requireRole('admin') en rutas de admin). */
export async function requireRole(role: DbUser["role"]): Promise<DbUser> {
  const user = await requireUser();
  if (user.role !== role) throw new ForbiddenError();
  return user;
}
