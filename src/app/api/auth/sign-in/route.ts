import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { withServiceContext } from "@/db/context";
import { users } from "@/db/schema";
import { getDummyHash, verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { getClientIp, rateLimitResponse, signInLimiter } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validations";
import { signInInput } from "@/lib/validations/auth";

const INVALID = { error: "Invalid email or password" };

/**
 * POST /api/auth/sign-in
 * Misma respuesta (401) y mismo tiempo de cómputo exista o no el email,
 * para no permitir enumerar cuentas. Rate limit por IP + email.
 */
export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, signInInput);
  if (!parsed.ok) return parsed.response;
  const { email, password } = parsed.data;

  const limited = await signInLimiter.limit(`${getClientIp(req)}:${email}`);
  if (!limited.success) return rateLimitResponse(limited.reset);

  const [user] = await withServiceContext((tx) =>
    tx
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1),
  );

  const hash = user?.passwordHash ?? (await getDummyHash());
  const valid = await verifyPassword(password, hash);
  if (!user || !user.passwordHash || !valid) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);
  return NextResponse.json({ ok: true });
}
