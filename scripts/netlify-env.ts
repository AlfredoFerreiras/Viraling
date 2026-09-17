/**
 * Pushes the environment variables this app needs from .env.local into the
 * linked Netlify site, so secrets are never retyped into a web form.
 *
 * Run it after `netlify login` and `netlify init`, from the project root:
 *   npm run netlify:env -- https://your-site.netlify.app
 *
 * The URL argument becomes NEXT_PUBLIC_APP_URL, which drives the CORS
 * allowlist in src/proxy.ts. Getting it wrong makes the API reject every
 * request with 403, so it is required rather than guessed.
 *
 * ADMIN_DATABASE_URL is deliberately never pushed: it is the owner role used
 * by local migration scripts and has no business in the deployed app.
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { execFileSync } from "node:child_process";

/** Pushed when present in .env.local. */
const OPTIONAL = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

/** The app will not work without these. */
const REQUIRED = ["DATABASE_URL", "ANTHROPIC_API_KEY", "CRON_SECRET", "DEMO_EMAIL"];

function setVar(key: string, value: string): void {
  execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["netlify", "env:set", key, value],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
}

function main(): void {
  const appUrl = process.argv[2];
  if (!appUrl || !/^https?:\/\//.test(appUrl)) {
    console.error(
      "Usage: npm run netlify:env -- https://your-site.netlify.app\n" +
        "That URL becomes NEXT_PUBLIC_APP_URL and drives the CORS allowlist.",
    );
    process.exit(1);
  }

  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`Missing from .env.local: ${missing.join(", ")}`);
    process.exit(1);
  }

  const pushed: string[] = [];

  for (const key of REQUIRED) {
    setVar(key, process.env[key]!);
    pushed.push(key);
  }

  for (const key of OPTIONAL) {
    const value = process.env[key];
    if (value) {
      setVar(key, value);
      pushed.push(key);
    } else {
      console.log(`  skipped ${key} (not set locally)`);
    }
  }

  setVar("NEXT_PUBLIC_APP_URL", appUrl.replace(/\/$/, ""));
  pushed.push("NEXT_PUBLIC_APP_URL");

  console.log(`\nPushed ${pushed.length} variables:`);
  for (const key of pushed) console.log(`  ${key}`);
  console.log("\nADMIN_DATABASE_URL was not pushed, by design.");
  console.log("Now run: npx netlify deploy --prod");
}

main();
