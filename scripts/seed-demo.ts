/**
 * Prepara una cuenta demo para visitantes del portfolio.
 *
 * Requisito: la cuenta ya existe en Clerk y entró al menos una vez a la
 * app (así existe su fila en users). Entonces este script:
 *  1. Sube el plan a pro.
 *  2. Ajusta el balance de tokens al cupo indicado (por defecto 60)
 *     registrando el movimiento en el ledger.
 *  3. Crea un nicho de ejemplo con brand_voice completo si la cuenta no
 *     tiene ninguno, para que aterrice directo en el dashboard.
 *
 * Idempotente: se puede correr de nuevo para "recargar" la demo.
 *
 * Uso: npm run db:seed-demo -- demo@ejemplo.com [tokens]
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

const DEMO_NICHE = {
  name: "Reparación de crédito en español",
  language: "es",
  audience: "Latinos en Estados Unidos con score bajo que quieren comprar casa o carro",
  offer: "Programa de reparación de crédito de 90 días con asesoría 1 a 1",
  ctaWord: "CRÉDITO",
  brandVoice: {
    sells: "Programa de reparación de crédito de 90 días con asesoría 1 a 1",
    ideal_client:
      "Latinos en Estados Unidos, entre 25 y 45 años, consumen contenido en español, tienen score entre 450 y 620",
    transformation:
      "De un score de 500 y rechazos en el banco a 700+ y aprobados para casa o carro",
    tone: "cercano, directo, sin tecnicismos, como un amigo que sabe del tema",
    never_say: "garantizado, milagro, borramos tu historial, dinero fácil",
    cta_word: "CRÉDITO",
    success_cases:
      "Más de 300 clientes, promedio de +120 puntos en 90 días, María pasó de 480 a 715 en 4 meses",
    recordings_per_week: 3,
  },
};

async function main() {
  const [email, tokensArg] = process.argv.slice(2);
  if (!email) {
    console.error("Uso: npm run db:seed-demo -- <email> [tokens]");
    process.exit(1);
  }
  const targetTokens = Number(tokensArg ?? 60);
  if (!Number.isInteger(targetTokens) || targetTokens < 0) {
    console.error("tokens debe ser un entero >= 0");
    process.exit(1);
  }

  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;

  const { withServiceContext } = await import("../src/db/context");
  const { niches, users } = await import("../src/db/schema");
  const { adminAdjustTokens } = await import("../src/lib/tokens");
  const { eq } = await import("drizzle-orm");

  const [user] = await withServiceContext((tx) =>
    tx.select().from(users).where(eq(users.email, email)).limit(1),
  );
  if (!user) {
    console.error(
      `No existe ${email} en la tabla users. Crea la cuenta en la app e inicia sesión una vez primero.`,
    );
    process.exit(1);
  }

  if (user.plan !== "pro") {
    await withServiceContext((tx) =>
      tx.update(users).set({ plan: "pro" }).where(eq(users.id, user.id)),
    );
    console.log("  plan -> pro");
  }

  const delta = targetTokens - user.tokensBalance;
  if (delta !== 0) {
    const { newBalance } = await adminAdjustTokens(
      user.id,
      delta,
      "recarga de cuenta demo",
    );
    console.log(`  tokens ${user.tokensBalance} -> ${newBalance}`);
  } else {
    console.log(`  tokens ya en ${targetTokens}`);
  }

  const existing = await withServiceContext((tx) =>
    tx.select({ id: niches.id }).from(niches).where(eq(niches.userId, user.id)).limit(1),
  );
  if (existing.length === 0) {
    await withServiceContext((tx) =>
      tx.insert(niches).values({ userId: user.id, ...DEMO_NICHE }),
    );
    console.log(`  nicho creado: ${DEMO_NICHE.name}`);
  } else {
    console.log("  la cuenta ya tiene nichos, no se crea el de ejemplo");
  }

  console.log("\nDemo lista.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
