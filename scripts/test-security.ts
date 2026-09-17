/**
 * Security verification (Prompt 9, block 9):
 *  1. Creates users A and B, each with data (niche, private format, script).
 *  2. Using the RLS context of A, tries to read/use the data of B: all empty.
 *  3. Endpoints with no session: 401. Admin routes with no session: 401/redirect.
 *  4. Rate limit: 10 hits on aiLimiter, blocked from the 6th onwards.
 *  5. Security headers and CORS with a foreign origin: present / 403.
 * Usage: npm run test:security  (requires the dev server running on :3000)
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

  console.log("== 1. Create users A and B with data ==");
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
      .values({ userId: userB.id, name: "Secret niche of B" })
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
        title: "Secret script of B",
        sections: [],
      })
      .returning(),
  );
  console.log("  test users and data created");

  try {
    console.log("\n== 2. Cross access using the RLS context of A ==");
    const nichesSeenByA = await withDbContext(
      { userId: userA.id, role: "user" },
      (tx) => tx.select().from(niches).where(eq(niches.userId, userB.id)),
    );
    check("A cannot read the niches of B", nichesSeenByA.length === 0);

    const scriptSeenByA = await withDbContext(
      { userId: userA.id, role: "user" },
      (tx) => tx.select().from(scripts).where(eq(scripts.id, scriptB.id)),
    );
    check("A cannot read a script of B by id", scriptSeenByA.length === 0);

    const formatSeenByA = await withDbContext(
      { userId: userA.id, role: "user" },
      (tx) => tx.select().from(formats).where(eq(formats.id, formatB.id)),
    );
    check(
      "A cannot see (or generate with) the private format of B",
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
    check("A cannot read the ledger of B", ledgerSeenByA.length === 0);

    const stealUpdate = await withDbContext(
      { userId: userA.id, role: "user" },
      (tx) =>
        tx
          .update(niches)
          .set({ name: "hackeado" })
          .where(eq(niches.id, nicheB.id))
          .returning(),
    );
    check("A cannot modify the niche of B", stealUpdate.length === 0);

    console.log("\n== 3. Endpoints with no session ==");
    const gen = await fetch(`${BASE}/api/ai/generate-script`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    check("POST /api/ai/generate-script with no session -> 401", gen.status === 401);

    const ext = await fetch(`${BASE}/api/ai/extract-format`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    check("POST /api/ai/extract-format with no session -> 401", ext.status === 401);

    const adminApi = await fetch(`${BASE}/api/admin/users`);
    check("GET /api/admin/users with no session -> 401", adminApi.status === 401);

    const adminPage = await fetch(`${BASE}/admin`, { redirect: "manual" });
    check(
      "GET /admin with no session -> redirect to sign-in",
      adminPage.status === 307 || adminPage.status === 302,
      `status ${adminPage.status}`,
    );

    console.log("\n== 4. Rate limit (5/min per user on aiLimiter) ==");
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
    console.error("\nSECURITY VERIFICATION FAILED");
    process.exit(1);
  }
  console.log("\nSECURITY VERIFICATION OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
