import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { withServiceContext } from "@/db/context";
import { users } from "@/db/schema";

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
 * Resuelve el usuario de la DB desde la sesión de Clerk.
 * Devuelve null si no hay sesión.
 *
 * El rol SIEMPRE sale de users.role en la DB, nunca de metadata del
 * cliente. Esta es la query de bootstrap (aún no conocemos el user id
 * de la DB), por eso corre en contexto de servicio.
 *
 * Si el usuario existe en Clerk pero no en la DB (webhook no llegó,
 * p. ej. en desarrollo local sin túnel), se crea aquí con los defaults
 * del schema: role user, plan free, 3 tokens. El webhook y este upsert
 * son idempotentes entre sí (onConflictDoNothing sobre clerk_id).
 */
export async function getCurrentUser(): Promise<DbUser | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const existing = await withServiceContext((tx) =>
    tx.select().from(users).where(eq(users.clerkId, clerkId)).limit(1),
  );
  if (existing[0]) return existing[0];

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? "";

  const inserted = await withServiceContext((tx) =>
    tx
      .insert(users)
      .values({ clerkId, email })
      .onConflictDoNothing({ target: users.clerkId })
      .returning(),
  );
  if (inserted[0]) return inserted[0];

  // Carrera con el webhook: el insert no devolvió fila, ya existe.
  const raced = await withServiceContext((tx) =>
    tx.select().from(users).where(eq(users.clerkId, clerkId)).limit(1),
  );
  return raced[0] ?? null;
}

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
