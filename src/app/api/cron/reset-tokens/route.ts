import { NextResponse, type NextRequest } from "next/server";
import { monthlyReset } from "@/lib/tokens";

/**
 * Cron mensual (vercel.json: día 1 a las 00:00 UTC): resetea free a 3
 * y pro a 60, registrando monthly_reset en el ledger.
 * Vercel manda Authorization: Bearer CRON_SECRET automáticamente.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { usersReset } = await monthlyReset();
  return NextResponse.json({ ok: true, usersReset });
}
