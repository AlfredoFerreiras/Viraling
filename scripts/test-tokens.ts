/**
 * Token ledger test (Prompt 4, block 4):
 *  1. Creates a test user with 3 tokens.
 *  2. Tries to consume 5: must throw InsufficientTokensError and the
 *     balance must NOT change (and no ledger entry may appear).
 *  3. Consumes 1: balance 2 and a -1 entry in the ledger.
 *  4. Acredita 10 → balance 12 y movimiento +10.
 *  5. Cleans up the test user.
 * Uso: npm run test:tokens
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

async function main() {
  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;

  const { users, tokenTransactions } = await import("../src/db/schema");
  const { consumeTokens, grantTokens, InsufficientTokensError } = await import(
    "../src/lib/tokens"
  );
  const { withServiceContext } = await import("../src/db/context");
  const { eq } = await import("drizzle-orm");

  let failed = false;
  const check = (name: string, cond: boolean) => {
    console.log(`  ${cond ? "PASS" : "FAIL"}  ${name}`);
    if (!cond) failed = true;
  };

  // 1. test user
  const [testUser] = await withServiceContext((tx) =>
    tx
      .insert(users)
      .values({
        email: `test-tokens-${process.pid}@formatbrain.test`,
      })
      .returning(),
  );
  console.log(`Test user created with balance ${testUser.tokensBalance}`);

  try {
    // 2. consume more than available
    let threw = false;
    try {
      await consumeTokens(testUser.id, 5, "generation");
    } catch (err) {
      threw = err instanceof InsufficientTokensError;
    }
    check("consuming 5 with balance 3 throws InsufficientTokensError", threw);

    const [after] = await withServiceContext((tx) =>
      tx.select().from(users).where(eq(users.id, testUser.id)),
    );
    check("the balance did NOT change (still 3)", after.tokensBalance === 3);

    const ledgerAfterFail = await withServiceContext((tx) =>
      tx
        .select()
        .from(tokenTransactions)
        .where(eq(tokenTransactions.userId, testUser.id)),
    );
    check("no ledger movement was recorded", ledgerAfterFail.length === 0);

    // 3. valid consumption
    const consumed = await consumeTokens(testUser.id, 1, "generation");
    check("consumir 1 deja balance 2", consumed.newBalance === 2);

    // 4. acreditar
    const granted = await grantTokens(testUser.id, 10, "admin_grant");
    check("acreditar 10 deja balance 12", granted.newBalance === 12);

    const ledger = await withServiceContext((tx) =>
      tx
        .select()
        .from(tokenTransactions)
        .where(eq(tokenTransactions.userId, testUser.id)),
    );
    const amounts = ledger.map((l) => l.amount).sort((a, b) => a - b);
    check(
      "the ledger holds exactly the -1 and +10 movements",
      amounts.length === 2 && amounts[0] === -1 && amounts[1] === 10,
    );
  } finally {
    // 5. limpieza
    await withServiceContext(async (tx) => {
      await tx
        .delete(tokenTransactions)
        .where(eq(tokenTransactions.userId, testUser.id));
      await tx.delete(users).where(eq(users.id, testUser.id));
    });
    console.log("Test user deleted");
  }

  if (failed) {
    console.error("\nTEST FALLIDO");
    process.exit(1);
  }
  console.log("\nALL TESTS PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
