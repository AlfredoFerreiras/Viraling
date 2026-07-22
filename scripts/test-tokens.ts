/**
 * Test del ledger de tokens (Prompt 4 · bloque 4):
 *  1. Crea un usuario de prueba con 3 tokens.
 *  2. Intenta consumir 5 → debe lanzar InsufficientTokensError y el
 *     balance NO debe cambiar (ni aparecer movimiento en el ledger).
 *  3. Consume 1 → balance 2 y movimiento -1 en el ledger.
 *  4. Acredita 10 → balance 12 y movimiento +10.
 *  5. Limpia el usuario de prueba.
 * Uso: npm run test:tokens
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

async function main() {
  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;

  const { db } = await import("../src/db/index");
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

  // 1. usuario de prueba
  const [testUser] = await withServiceContext((tx) =>
    tx
      .insert(users)
      .values({
        clerkId: `test_tokens_${process.pid}`,
        email: "test-tokens@formatbrain.test",
      })
      .returning(),
  );
  console.log(`Usuario de prueba creado con balance ${testUser.tokensBalance}`);

  try {
    // 2. consumir más de lo disponible
    let threw = false;
    try {
      await consumeTokens(testUser.id, 5, "generation");
    } catch (err) {
      threw = err instanceof InsufficientTokensError;
    }
    check("consumir 5 con balance 3 lanza InsufficientTokensError", threw);

    const [after] = await withServiceContext((tx) =>
      tx.select().from(users).where(eq(users.id, testUser.id)),
    );
    check("el balance NO cambió (sigue en 3)", after.tokensBalance === 3);

    const ledgerAfterFail = await withServiceContext((tx) =>
      tx
        .select()
        .from(tokenTransactions)
        .where(eq(tokenTransactions.userId, testUser.id)),
    );
    check("no se registró ningún movimiento", ledgerAfterFail.length === 0);

    // 3. consumo válido
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
      "el ledger tiene exactamente los movimientos -1 y +10",
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
    console.log("Usuario de prueba eliminado");
  }

  if (failed) {
    console.error("\nTEST FALLIDO");
    process.exit(1);
  }
  console.log("\nTODOS LOS TESTS PASAN");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
