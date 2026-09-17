import { NextResponse } from "next/server";
import { getCurrentUser, type DbUser } from "./auth";

/**
 * Guard for /api/admin route handlers: 401 with no session, 403 without the
 * admin role (the role comes from users.role in the DB, Prompt 2 section).
 */
export async function adminGuard(): Promise<
  { ok: true; admin: DbUser } | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }
  if (user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, admin: user };
}
