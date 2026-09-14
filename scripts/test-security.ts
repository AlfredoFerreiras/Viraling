/**
 * Verificación de seguridad (Prompt 9 · bloque 9):
 *  1. Crea usuarios A y B con datos cada uno (nicho, formato privado, guion).
 *  2. Con el contexto RLS de A intenta leer/usar datos de B: todo vacío.
 *  3. Endpoints sin sesión: 401. Rutas admin sin sesión: 401/redirect.
 *  4. Rate limit: 10 hits al aiLimiter, del 6º en adelante bloqueado.
 *  5. Headers de seguridad y CORS con origin ajeno: presentes / 403.
 * Uso: npm run test:security  (requiere dev server corriendo en :3000)
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function main() {
  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;

  const { withDbContext, withServiceContext } = await import("../src/db/context");
  const { users, niches, formats, scripts, tokenTransactions } = await import(
    "../src/db/schema"
  );
  const { eq, inArray } = await import("drizzle-orm");

  let failed = false;
  const check = (name: string, cond: boolean, extra = "") => {
    console.log(`  ${cond ? "PASS" : "FAIL"}  ${name}${extra ? ` (${extra})` : ""}`);
    if (!cond) failed = true;
  };

  console.log("== 1. Crear usuarios A y B con datos ==");
  const [userA, userB] = await withServiceContext((tx) =>
    tx
      .insert(users)
      .values([
        { email: `sec-a-${process.pid}@test.local` },
        { email: `sec-b-${process.pid}@test.local` },
      ])
      .returning(),
  );

  const [nicheB] = await withDbContext({ userId: userB.id, role: "user" }, (tx) =>
    tx
      .insert(niches)
      .values({ userId: userB.id, name: "Nicho secreto de B" })
      .returning(),
  );
  const [formatB] = await withDbContext({ userId: userB.id, role: "user" }, (tx) =>
    tx
      .insert(formats)
      .values({
        ownerScope: "user",
        userId: userB.id,
        name: "Formato privado de B",
        contentType: "reel",
        skeleton: { secret: true },
      })
      .returning(),
  );
  const [scriptB] = await withDbContext({ userId: userB.id, role: "user" }, (tx) =>
    tx
      .insert(scripts)
      .values({
        userId: userB.id,
        nicheId: nicheB.id,
        formatId: formatB.id,
        contentType: "reel",
        title: "Guion secreto de B",
        sections: [],
      })
      .returning(),
  );
  console.log("  usuarios y datos de prueba creados");

  try {
    console.log("\n== 2. Acceso cruzado con contexto RLS de A ==");
    const nichesSeenByA = await withDbContext(
      { userId: userA.id, role: "user" },
      (tx) => tx.select().from(niches).where(eq(niches.userId, userB.id)),
    );
    check("A no puede leer los nichos de B", nichesSeenByA.length === 0);

    const scriptSeenByA = await withDbContext(
      { userId: userA.id, role: "user" },
      (tx) => tx.select().from(scripts).where(eq(scripts.id, scriptB.id)),
    );
    check("A no puede leer un guion de B por id", scriptSeenByA.length === 0);

    const formatSeenByA = await withDbContext(
      { userId: userA.id, role: "user" },
      (tx) => tx.select().from(formats).where(eq(formats.id, formatB.id)),
    );
    check(
      "A no puede ver (ni generar con) el formato privado de B",
      formatSeenByA.length === 0,
    );

    const ledgerSeenByA = await withDbContext(
      { userId: userA.id, role: "user" },
      (tx) =>
        tx
          .select()
          .from(tokenTransactions)
          .where(eq(tokenTransactions.userId, userB.id)),
    );
    check("A no puede leer el ledger de B", ledgerSeenByA.length === 0);

    const stealUpdate = await withDbContext(
      { userId: userA.id, role: "user" },
      (tx) =>
        tx
          .update(niches)
          .set({ name: "hackeado" })
          .where(eq(niches.id, nicheB.id))
          .returning(),
    );
    check("A no puede modificar el nicho de B", stealUpdate.length === 0);

    console.log("\n== 3. Endpoints sin sesión ==");
    const gen = await fetch(`${BASE}/api/ai/generate-script`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    check("POST /api/ai/generate-script sin sesión -> 401", gen.status === 401);

    const ext = await fetch(`${BASE}/api/ai/extract-format`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    check("POST /api/ai/extract-format sin sesión -> 401", ext.status === 401);

    const adminApi = await fetch(`${BASE}/api/admin/users`);
    check("GET /api/admin/users sin sesión -> 401", adminApi.status === 401);

    const adminPage = await fetch(`${BASE}/admin`, { redirect: "manual" });
    check(
      "GET /admin sin sesión -> redirect a sign-in",
      adminPage.status === 307 || adminPage.status === 302,
      `status ${adminPage.status}`,
    );

    console.log("\n== 4. Rate limit (5/min por user en aiLimiter) ==");
    const { aiLimiter } = await import("../src/lib/rate-limit");
    const results: boolean[] = [];
    for (let i = 0; i < 10; i++) {
      results.push((await aiLimiter.limit(`sec-test-${userA.id}`)).success);
    }
    check(
      "primeras 5 pasan, de la 6ª a la 10ª bloqueadas (429)",
      results.slice(0, 5).every(Boolean) && results.slice(5).every((r) => !r),
      results.map((r) => (r ? "ok" : "429")).join(","),
    );

    console.log("\n== 5. Headers de seguridad y CORS ==");
    const home = await fetch(`${BASE}/`);
    const csp = home.headers.get("content-security-policy");
    check("Content-Security-Policy presente", !!csp && csp.includes("default-src 'self'"));
    check("X-Frame-Options: DENY", home.headers.get("x-frame-options") === "DENY");
    check(
      "X-Content-Type-Options: nosniff",
      home.headers.get("x-content-type-options") === "nosniff",
    );
    check(
      "Referrer-Policy correcta",
      home.headers.get("referrer-policy") === "strict-origin-when-cross-origin",
    );

    const evil = await fetch(`${BASE}/api/niches`, {
      headers: { Origin: "https://evil.example.com" },
    });
    check("origin ajeno a la API -> 403", evil.status === 403);
  } finally {
    console.log("\n== Limpieza ==");
    await withServiceContext(async (tx) => {
      const ids = [userA.id, userB.id];
      await tx.delete(scripts).where(inArray(scripts.userId, ids));
      await tx.delete(formats).where(inArray(formats.userId, ids));
      await tx.delete(niches).where(inArray(niches.userId, ids));
      await tx
        .delete(tokenTransactions)
        .where(inArray(tokenTransactions.userId, ids));
      await tx.delete(users).where(inArray(users.id, ids));
    });
    console.log("  usuarios de prueba eliminados");
  }

  if (failed) {
    console.error("\nVERIFICACIÓN DE SEGURIDAD FALLIDA");
    process.exit(1);
  }
  console.log("\nVERIFICACIÓN DE SEGURIDAD OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
