import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { withDbContext } from "@/db/context";
import { formats, niches } from "@/db/schema";
import { AiOutputError, callClaudeJson, wrapUserData } from "@/lib/ai/claude";
import { EXTRACTOR_SYSTEM } from "@/lib/ai/prompts";
import { getCurrentUser } from "@/lib/auth";
import { enforceAiRateLimit } from "@/lib/rate-limit";
import { isAiEnabled } from "@/lib/settings";
import { parseBody } from "@/lib/validations";
import { extractFormatInput, skeletonOutput } from "@/lib/validations/ai";
import { consumeTokens, grantTokens, InsufficientTokensError } from "@/lib/tokens";

/**
 * POST /api/ai/extract-format (section 8.4)
 * Mandatory flow: session, rate limit, Zod, consumeTokens,
 * Claude, Zod on the output, save the format with owner_scope user.
 */
export async function POST(req: NextRequest) {
  // 1. Valid session
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Global kill switch (section 7.3.7)
  if (!(await isAiEnabled())) {
    return NextResponse.json(
      { error: "Generation is under maintenance, please try again later" },
      { status: 503 },
    );
  }

  // 2. Rate limit per user and per IP
  const limited = await enforceAiRateLimit(req, user.id);
  if (limited) return limited;

  // 3. Zod validation of the input
  const parsed = await parseBody(req, extractFormatInput);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  // App level ownership (on top of RLS): the niche must belong to the user
  if (input.nicheId) {
    const [niche] = await withDbContext({ userId: user.id, role: "user" }, (tx) =>
      tx
        .select({ id: niches.id })
        .from(niches)
        .where(and(eq(niches.id, input.nicheId!), eq(niches.userId, user.id)))
        .limit(1),
    );
    if (!niche) {
      return NextResponse.json({ error: "Niche not found" }, { status: 404 });
    }
  }

  // 4. Debit the token BEFORE calling Claude
  try {
    await consumeTokens(user.id, 1, "extraction");
  } catch (err) {
    if (err instanceof InsufficientTokensError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    throw err;
  }

  // 5. Claude + output validation (single internal retry)
  try {
    const userContent = [
      wrapUserData("transcript", input.transcript),
      input.visualDescription
        ? wrapUserData("descripcion_visual", input.visualDescription)
        : null,
      `Tipo de contenido: ${input.contentType}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const skeleton = await callClaudeJson({
      system: EXTRACTOR_SYSTEM,
      user: userContent,
      schema: skeletonOutput,
    });

    // 6. Save into formats with owner_scope user
    const [format] = await withDbContext({ userId: user.id, role: "user" }, (tx) =>
      tx
        .insert(formats)
        .values({
          ownerScope: "user",
          userId: user.id,
          nicheId: input.nicheId ?? null,
          name: input.name ?? skeleton.name,
          contentType: input.contentType,
          skeleton,
          sourceTranscript: input.transcript,
        })
        .returning(),
    );

    return NextResponse.json({ format }, { status: 201 });
  } catch (err) {
    // Claude or save failure: refund the spent token
    await grantTokens(user.id, 1, "refund");
    if (err instanceof AiOutputError) {
      return NextResponse.json(
        { error: "The AI did not return a valid format, your credit was refunded" },
        { status: 502 },
      );
    }
    throw err;
  }
}
