/**
 * Crea el rol app_user SIN BYPASSRLS para el runtime de la app.
 * El rol dueño de Neon (neondb_owner) tiene BYPASSRLS, así que si la app
 * se conecta con él, TODO el RLS se ignora. Defensa real = rol dedicado.
 *
 * Uso: APP_ROLE_PASSWORD=xxx tsx scripts/setup-app-role.ts
 * (usa ADMIN_DATABASE_URL o DATABASE_URL como conexión de owner)
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
    // La contraseña se interpola porque CREATE ROLE no acepta parámetros;
    // viene de env local, nunca de input de usuario.
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
  console.log("Permisos otorgados sobre schema public");

  const check = await pool.query(
    "select rolbypassrls from pg_roles where rolname = 'app_user'",
  );
  console.log(`app_user bypassrls = ${check.rows[0].rolbypassrls} (debe ser false)`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
