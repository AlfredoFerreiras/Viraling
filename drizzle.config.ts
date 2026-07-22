import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js carga .env.local solo; drizzle-kit corre fuera de Next
config({ path: [".env.local", ".env"] });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida (revisa .env.local / .env)");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
