import { sql } from "drizzle-orm";
import { db } from "./index";

export type AppRole = "user" | "editor_house" | "editor_external" | "admin";

export type DbTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export interface DbContext {
  userId: string;
  role: AppRole;
}

/**
 * Ejecuta `fn` dentro de una transacción con el contexto RLS seteado.
 *
 * Todas las queries de requests autenticados DEBEN pasar por aquí: las
 * policies de RLS filtran por app.current_user_id y app.current_role, y
 * set_config(..., true) limita esos valores a la transacción actual, así
 * que nunca se filtran entre requests que comparten conexión del pool.
 */
export async function withDbContext<T>(
  ctx: DbContext,
  fn: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`
      select
        set_config('app.current_user_id', ${ctx.userId}, true),
        set_config('app.current_role', ${ctx.role}, true)
    `);
    return fn(tx);
  });
}

/**
 * Contexto para operaciones de sistema SIN sesión de usuario
 * (webhook de Clerk, crons). Corre con app.current_role = 'admin',
 * que las policies reconocen como acceso total.
 *
 * Usar SOLO desde código de servidor que ya verificó su propia
 * autenticidad (firma del webhook, CRON_SECRET, etc.).
 */
export async function withServiceContext<T>(
  fn: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`
      select
        set_config('app.current_user_id', '', true),
        set_config('app.current_role', 'admin', true)
    `);
    return fn(tx);
  });
}
