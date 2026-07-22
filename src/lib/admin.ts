import { NextResponse } from "next/server";
import { getCurrentUser, type DbUser } from "./auth";

/**
 * Guard para route handlers de /api/admin: 401 sin sesión, 403 sin rol
 * admin (el rol sale de users.role en la DB, sección de Prompt 2).
 */
export async function adminGuard(): Promise<
  { ok: true; admin: DbUser } | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }
  if (user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sin permisos" }, { status: 403 }),
    };
  }
  return { ok: true, admin: user };
}
