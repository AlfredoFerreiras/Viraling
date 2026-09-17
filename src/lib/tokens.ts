import { and, eq, gte, sql } from "drizzle-orm";
import { withDbContext, withServiceContext } from "../db/context";
import { tokenTransactions, users } from "../db/schema";

/**
 * HARD RULE (section 7.3): users.tokens_balance is NEVER updated
 * directly anywhere else in the code. Every debit goes through
 * consumeTokens and every credit through grantTokens, and both record the
 * movement in token_transactions (auditable ledger) in THE SAME
 * transaction that changes the balance.
 */

export class InsufficientTokensError extends Error {
  constructor() {
    super("Not enough credits");
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
 * Debits `amount` tokens from the user in ONE transaction:
 * checks the balance is sufficient, debits it and inserts the negative
 * movement in the ledger. If it is not enough, it throws
 * InsufficientTokensError and nothing changes (the whole transaction rolls back).
 *
 * Runs in the RLS context of the user itself: it can only touch their
 * own users row and their own ledger rows.
 */
export async function consumeTokens(
  userId: string,
  amount: number,
  reason: ConsumeReason,
  refId?: string,
): Promise<{ newBalance: number }> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer");
  }

  return withDbContext({ userId, role: "user" }, async (tx) => {
    // Conditional update: only debits if the balance is enough.
    // The WHERE with gte avoids the race between two simultaneous requests.
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
 * in ONE transaction: adds to the balance and inserts the positive
 * movement in the ledger.
 *
 * Runs in the service context because credits originate in the
 * system (Stripe webhook, cron, admin panel), not in the user.
 */
export async function grantTokens(
  userId: string,
  amount: number,
  reason: GrantReason,
  refId?: string,
): Promise<{ newBalance: number }> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer");
  }

  return withServiceContext(async (tx) => {
    const updated = await tx
      .update(users)
      .set({ tokensBalance: sql`${users.tokensBalance} + ${amount}` })
      .where(eq(users.id, userId))
      .returning({ newBalance: users.tokensBalance });

    if (!updated[0]) {
      throw new Error(`User ${userId} does not exist`);
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

/**
 * Manual admin adjustment (block 8): credits (amount > 0) or removes
 * (amount < 0, never below 0) tokens with a mandatory reason that stays
 * in the ledger. Same transaction for balance + movement.
 */
export async function adminAdjustTokens(
  userId: string,
  amount: number,
  reason: string,
): Promise<{ newBalance: number }> {
  if (!Number.isInteger(amount) || amount === 0) {
    throw new Error("amount must be a non-zero integer");
  }
  if (!reason.trim()) {
    throw new Error("A reason is required");
  }

  return withServiceContext(async (tx) => {
    const updated = await tx
      .update(users)
      .set({
        tokensBalance: sql`greatest(${users.tokensBalance} + ${amount}, 0)`,
      })
      .where(eq(users.id, userId))
      .returning({ newBalance: users.tokensBalance });

    if (!updated[0]) {
      throw new Error(`User ${userId} does not exist`);
    }

    await tx.insert(tokenTransactions).values({
      userId,
      amount,
      reason: `admin: ${reason.trim()}`,
    });

    return { newBalance: updated[0].newBalance };
  });
}

/** Tokens per plan on the monthly reset (section 10). */
export const MONTHLY_TOKENS: Record<string, number> = {
  free: 3,
  pro: 60,
  pro_editor: 60,
};

/**
 * Monthly reset (called by the cron): sets each user balance to their
 * plan quota and records the delta as monthly_reset in the ledger.
 * All in one service transaction.
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
