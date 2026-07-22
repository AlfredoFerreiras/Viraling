/**
 * Asigna un rol a un usuario por email (el rol vive en users.role, DB).
 * Uso: npm run user:set-role -- correo@ejemplo.com admin
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const VALID_ROLES = ["user", "editor_house", "editor_external", "admin"];

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !VALID_ROLES.includes(role)) {
    console.error(
      `Uso: npm run user:set-role -- <email> <${VALID_ROLES.join("|")}>`,
    );
    process.exit(1);
  }
  const pool = new Pool({
    connectionString:
      process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL,
  });
  const res = await pool.query(
    "update users set role = $1 where email = $2 returning email, role",
    [role, email],
  );
  await pool.end();
  if (res.rowCount === 0) {
    console.error(`No existe usuario con email ${email}`);
    process.exit(1);
  }
  console.log(`OK: ${res.rows[0].email} ahora es ${res.rows[0].role}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
