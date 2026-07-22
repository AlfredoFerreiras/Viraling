/**
 * Verifica que las tablas de Fase 1 existen, que RLS está activo y
 * forzado en todas, y lista las policies creadas.
 * Uso: npm run db:verify
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const EXPECTED_TABLES = [
  "users",
  "niches",
  "formats",
  "scripts",
  "token_transactions",
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida (revisa .env.local)");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const tables = await pool.query(
    `select c.relname as table_name,
            c.relrowsecurity as rls_enabled,
            c.relforcerowsecurity as rls_forced
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname`,
  );

  console.log("== Tablas ==");
  let ok = true;
  for (const expected of EXPECTED_TABLES) {
    const row = tables.rows.find((r) => r.table_name === expected);
    if (!row) {
      console.log(`  FALTA: ${expected}`);
      ok = false;
    } else {
      const rls = row.rls_enabled && row.rls_forced;
      console.log(
        `  ${expected}: rls_enabled=${row.rls_enabled} rls_forced=${row.rls_forced}${rls ? "" : "  <-- PROBLEMA"}`,
      );
      if (!rls) ok = false;
    }
  }

  const policies = await pool.query(
    `select tablename, policyname, cmd
       from pg_policies
      where schemaname = 'public'
      order by tablename, policyname`,
  );

  console.log("\n== Policies ==");
  for (const p of policies.rows) {
    console.log(`  ${p.tablename}.${p.policyname} (${p.cmd})`);
  }

  await pool.end();
  if (!ok) {
    console.error("\nVerificación FALLIDA");
    process.exit(1);
  }
  console.log("\nVerificación OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
