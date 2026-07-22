import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/admin";
import { isAiEnabled, setAiEnabled } from "@/lib/settings";
import { parseBody } from "@/lib/validations";

export async function GET() {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  return NextResponse.json({ enabled: await isAiEnabled() });
}

export async function POST(req: NextRequest) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const parsed = await parseBody(req, z.object({ enabled: z.boolean() }));
  if (!parsed.ok) return parsed.response;

  await setAiEnabled(parsed.data.enabled);
  return NextResponse.json({ enabled: parsed.data.enabled });
}
