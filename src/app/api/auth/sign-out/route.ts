import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  invalidateSession,
  readSessionCookie,
} from "@/lib/auth/session";

/** POST /api/auth/sign-out: deletes the DB session and the cookie. */
export async function POST() {
  const token = await readSessionCookie();
  if (token) await invalidateSession(token);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
