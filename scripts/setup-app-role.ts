/**
 * Creates the app_user role WITHOUT BYPASSRLS for the app runtime.
 * The Neon owner role (neondb_owner) has BYPASSRLS, so if the app
 * connects with it, ALL RLS is ignored. Real defence = a dedicated role.
 *
 * Uso: APP_ROLE_PASSWORD=xxx tsx scripts/setup-app-role.ts
 * (uses ADMIN_DATABASE_URL or DATABASE_URL as the owner connection)
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function main() {
  const adminUrl = process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL;
  const password = process.env.APP_ROLE_PASSWORD;
  if (!adminUrl) throw new Error("Falta ADMIN_DATABASE_URL/DATABASE_URL");
  if (!password) throw new Error("Falta APP_ROLE_PASSWORD");

  const pool = new Pool({ connectionString: adminUrl });

  const { rows } = await pool.query(
    "select 1 from pg_roles where rolname = 'app_user'",
  );
  if (rows.length === 0) {
    // The password is interpolated because CREATE ROLE takes no parameters;
    // it comes from the local env, never from user input.
    await pool.query(
      `create role app_user with login password '${password.replace(/'/g, "''")}' nobypassrls`,
    );
    console.log("Rol app_user creado");
  } else {
    await pool.query(
      `alter role app_user with login password '${password.replace(/'/g, "''")}' nobypassrls`,
    );
    console.log("Rol app_user actualizado");
  }

  await pool.query(`
    grant usage on schema public to app_user;
    grant select, insert, update, delete on all tables in schema public to app_user;
    alter default privileges in schema public grant select, insert, update, delete on tables to app_user;
  `);
  console.log("Permissions granted on schema public");

  const check = await pool.query(
    "select rolbypassrls from pg_roles where rolname = 'app_user'",
  );
  console.log(`app_user bypassrls = ${check.rows[0].rolbypassrls} (must be false)`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
