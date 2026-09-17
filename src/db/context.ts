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
 * Runs `fn` inside a transaction with the RLS context set.
 *
 * Every query from an authenticated request MUST go through here: the
 * RLS policies filter on app.current_user_id and app.current_role, and
 * set_config(..., true) scopes those values to the current transaction, so
 * they never leak between requests sharing a pool connection.
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
 * Context for system operations with NO user session
 * (login, crons, scripts). Runs with app.current_role = 'admin',
 * which the policies treat as full access.
 *
 * Use ONLY from server code that has already verified its own
 * authenticity (login checked with bcrypt, CRON_SECRET, etc.).
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
