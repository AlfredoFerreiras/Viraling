import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/admin";
import { adminAdjustTokens } from "@/lib/tokens";
import { parseBody, uuidSchema } from "@/lib/validations";

const bodySchema = z.object({
  amount: z.number().int().min(-1000).max(1000).refine((n) => n !== 0, {
    message: "amount cannot be 0",
  }),
  reason: z.string().min(3).max(300),
});

/** Grant or remove tokens with a mandatory reason (kept in the ledger). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const idParsed = uuidSchema.safeParse((await params).id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const parsed = await parseBody(req, bodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const { newBalance } = await adminAdjustTokens(
      idParsed.data,
      parsed.data.amount,
      parsed.data.reason,
    );
    return NextResponse.json({ newBalance });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    );
  }
}
