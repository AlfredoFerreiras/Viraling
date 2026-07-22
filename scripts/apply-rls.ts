/**
 * Aplica los archivos SQL de RLS (drizzle/rls/*.sql) a la base.
 * Uso: npm run db:rls
 * Los archivos son idempotentes: se pueden re-aplicar sin romper nada.
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { neonConfig, Pool } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function main() {
  const url = process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no está definida (revisa .env.local)");
  }
  const pool = new Pool({ connectionString: url });
  const dir = join(process.cwd(), "drizzle", "rls");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    process.stdout.write(`Aplicando ${file}... `);
    await pool.query(sql);
    console.log("OK");
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
