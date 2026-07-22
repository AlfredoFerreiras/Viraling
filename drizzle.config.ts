import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js carga .env.local solo; drizzle-kit corre fuera de Next
config({ path: [".env.local", ".env"] });

// Migraciones con el rol owner (DDL); la app corre con app_user (RLS real)
const url = process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL no está definida (revisa .env.local / .env)");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
