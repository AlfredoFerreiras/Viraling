import { NextResponse, type NextRequest } from "next/server";
import { monthlyReset } from "@/lib/tokens";

/**
 * Monthly cron (vercel.json: day 1 at 00:00 UTC): resets free to 3
 * and pro to 60, recording monthly_reset in the ledger.
 * Vercel sends Authorization: Bearer CRON_SECRET automatically.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { usersReset } = await monthlyReset();
  return NextResponse.json({ ok: true, usersReset });
}
