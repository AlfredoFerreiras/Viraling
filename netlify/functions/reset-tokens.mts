import type { Config } from "@netlify/functions";

/**
 * Monthly token reset (section 7.3 / block 8).
 *
 * Netlify cannot put a schedule on an App Router route handler, so the
 * schedule lives here and this function calls the real endpoint with the
 * same Bearer CRON_SECRET that Vercel Cron used to send. The reset logic
 * itself stays in src/app/api/cron/reset-tokens/route.ts.
 */
export default async function resetTokens(): Promise<Response> {
  const base = process.env.URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.CRON_SECRET;

  if (!base || !secret) {
    console.error("reset-tokens: URL or CRON_SECRET is not set");
    return new Response("Missing configuration", { status: 500 });
  }

  const res = await fetch(`${base.replace(/\/$/, "")}/api/cron/reset-tokens`, {
    headers: { authorization: `Bearer ${secret}` },
  });
  const body = await res.text();

  if (!res.ok) {
    console.error(`reset-tokens: ${res.status} ${body}`);
    return new Response(body, { status: res.status });
  }

  console.log(`reset-tokens: ${body}`);
  return new Response(body, { status: 200 });
}

export const config: Config = {
  schedule: "0 0 1 * *",
};
