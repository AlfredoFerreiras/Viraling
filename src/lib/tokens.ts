import { and, eq, gte, sql } from "drizzle-orm";
import { withDbContext, withServiceContext } from "../db/context";
import { tokenTransactions, users } from "../db/schema";

/**
 * REGLA DURA (sección 7.3): users.tokens_balance NUNCA se actualiza
 * directo en ningún otro lugar del código. Todo débito pasa por
 * consumeTokens y todo crédito por grantTokens, y ambos registran el
 * movimiento en token_transactions (ledger auditable) en LA MISMA
 * transacción que modifica el balance.
 */

export class InsufficientTokensError extends Error {
  constructor() {
    super("No tienes tokens suficientes");
    this.name = "InsufficientTokensError";
  }
}

export type ConsumeReason = "generation" | "extraction" | "analysis";
export type GrantReason =
  | "monthly_reset"
  | "purchase"
  | "admin_grant"
  | "refund";

/**
 * Descuenta `amount` tokens del usuario en UNA transacción:
 * verifica balance suficiente, descuenta e inserta el movimiento
 * negativo en el ledger. Si no alcanza, lanza InsufficientTokensError
 * y nada se modifica (la transacción entera se revierte).
 *
 * Corre en el contexto RLS del propio usuario: solo puede tocar su
 * fila de users y sus filas del ledger.
 */
export async function consumeTokens(
  userId: string,
  amount: number,
  reason: ConsumeReason,
  refId?: string,
): Promise<{ newBalance: number }> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount debe ser un entero positivo");
  }

  return withDbContext({ userId, role: "user" }, async (tx) => {
    // Update condicional: solo descuenta si el balance alcanza.
    // El WHERE con gte evita la carrera de dos requests simultáneos.
    const updated = await tx
      .update(users)
      .set({ tokensBalance: sql`${users.tokensBalance} - ${amount}` })
      .where(and(eq(users.id, userId), gte(users.tokensBalance, amount)))
      .returning({ newBalance: users.tokensBalance });

    if (!updated[0]) {
      throw new InsufficientTokensError();
    }

    await tx.insert(tokenTransactions).values({
      userId,
      amount: -amount,
      reason,
      refId: refId ?? null,
    });

    return { newBalance: updated[0].newBalance };
  });
}

/**
 * Acredita `amount` tokens (compras, reset mensual, admin, reembolso)
 * en UNA transacción: suma al balance e inserta el movimiento positivo
 * en el ledger.
 *
 * Corre en contexto de servicio porque los créditos los origina el
 * sistema (webhook de Stripe, cron, panel admin), no el usuario.
 */
export async function grantTokens(
  userId: string,
  amount: number,
  reason: GrantReason,
  refId?: string,
): Promise<{ newBalance: number }> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount debe ser un entero positivo");
  }

  return withServiceContext(async (tx) => {
    const updated = await tx
      .update(users)
      .set({ tokensBalance: sql`${users.tokensBalance} + ${amount}` })
      .where(eq(users.id, userId))
      .returning({ newBalance: users.tokensBalance });

    if (!updated[0]) {
      throw new Error(`Usuario ${userId} no existe`);
    }

    await tx.insert(tokenTransactions).values({
      userId,
      amount,
      reason,
      refId: refId ?? null,
    });

    return { newBalance: updated[0].newBalance };
  });
}

/** Tokens por plan al reset mensual (sección 10). */
export const MONTHLY_TOKENS: Record<string, number> = {
  free: 3,
  pro: 60,
  pro_editor: 60,
};

/**
 * Reset mensual (lo llama el cron): fija el balance de cada usuario al
 * cupo de su plan y registra el delta como monthly_reset en el ledger.
 * Todo en una transacción de servicio.
 */
export async function monthlyReset(): Promise<{ usersReset: number }> {
  return withServiceContext(async (tx) => {
    const rows = await tx.execute(sql`
      with target as (
        select id,
               tokens_balance as old_balance,
               case
                 when plan = 'free' then ${MONTHLY_TOKENS.free}::int
                 else ${MONTHLY_TOKENS.pro}::int
               end as new_balance
        from users
        where role = 'user'
        for update
      )
      update users u
         set tokens_balance = t.new_balance,
             tokens_reset_at = now()
        from target t
       where u.id = t.id
       returning u.id as user_id, t.new_balance - t.old_balance as delta
    `);

    const resets = rows.rows as { user_id: string; delta: number }[];
    const movements = resets.filter((r) => Number(r.delta) !== 0);
    if (movements.length > 0) {
      await tx.insert(tokenTransactions).values(
        movements.map((r) => ({
          userId: r.user_id,
          amount: Number(r.delta),
          reason: "monthly_reset",
        })),
      );
    }
    return { usersReset: resets.length };
  });
}
