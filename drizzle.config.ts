import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js only loads .env.local; drizzle-kit runs outside Next
config({ path: [".env.local", ".env"] });

// Migrations run as the owner role (DDL); the app runs as app_user (real RLS)
const url = process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not defined (check .env.local / .env)");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
