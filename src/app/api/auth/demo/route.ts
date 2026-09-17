import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { withServiceContext } from "@/db/context";
import { users } from "@/db/schema";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { DEMO_EMAIL, isDemoEnabled } from "@/lib/demo";
import { getClientIp, rateLimitResponse, signInLimiter } from "@/lib/rate-limit";

/**
 * POST /api/auth/demo
 *
 * One click entry into the shared read-and-write demo account, so a visitor
 * can look around without typing credentials.
 *
 * This is a deliberate public door, so it is narrow on purpose:
 *  - it only ever opens a session for the single account named by DEMO_EMAIL,
 *    and there is no way to ask it for a different one
 *  - it is off entirely when DEMO_EMAIL is not configured
 *  - it shares the sign-in rate limiter, keyed per IP
 *  - the demo account is a normal user: RLS, the token ledger and the AI
 *    rate limits all apply to it exactly as they do to anyone else, which is
 *    what caps what a visitor can spend
 */
export async function POST(req: NextRequest) {
  if (!isDemoEnabled()) {
    return NextResponse.json({ error: "Demo access is disabled" }, { status: 404 });
  }

  const limited = await signInLimiter.limit(`demo:${getClientIp(req)}`);
  if (!limited.success) return rateLimitResponse(limited.reset);

  const [user] = await withServiceContext((tx) =>
    tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEMO_EMAIL))
      .limit(1),
  );

  if (!user) {
    return NextResponse.json({ error: "Demo account not provisioned" }, { status: 503 });
  }

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);
  return NextResponse.json({ ok: true });
}
