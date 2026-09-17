import { NextResponse, type NextRequest } from "next/server";
import { withServiceContext } from "@/db/context";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { getClientIp, rateLimitResponse, signUpLimiter } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validations";
import { signUpInput } from "@/lib/validations/auth";

/**
 * POST /api/auth/sign-up
 * Creates the account (role user, plan free, 3 credits from the schema defaults)
 * and opens a session. No email verification: the per IP rate limit bounds
 * mass account creation.
 */
export async function POST(req: NextRequest) {
  const limited = await signUpLimiter.limit(getClientIp(req));
  if (!limited.success) return rateLimitResponse(limited.reset);

  const parsed = await parseBody(req, signUpInput);
  if (!parsed.ok) return parsed.response;
  const { email, password } = parsed.data;

  const passwordHash = await hashPassword(password);
  const [user] = await withServiceContext((tx) =>
    tx
      .insert(users)
      .values({ email, passwordHash })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id }),
  );
  if (!user) {
    return NextResponse.json(
      { error: "That email is already registered" },
      { status: 409 },
    );
  }

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);
  return NextResponse.json({ ok: true }, { status: 201 });
}
