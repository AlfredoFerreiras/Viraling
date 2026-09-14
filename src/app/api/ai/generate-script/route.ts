import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { withDbContext } from "@/db/context";
import { formats, niches, scripts } from "@/db/schema";
import { AiOutputError, callClaudeJson, wrapUserData } from "@/lib/ai/claude";
import { generatorSystem } from "@/lib/ai/prompts";
import { getCurrentUser } from "@/lib/auth";
import { enforceAiRateLimit } from "@/lib/rate-limit";
import { isAiEnabled } from "@/lib/settings";
import { parseBody } from "@/lib/validations";
import { generateScriptInput, scriptOutputByType } from "@/lib/validations/ai";
import { consumeTokens, grantTokens, InsufficientTokensError } from "@/lib/tokens";

/**
 * POST /api/ai/generate-script (secciones 8.3 y 9.2)
 * Mismo flujo de seguridad que extract-format. La salida cambia según
 * contentType (reel | carousel | story).
 */
export async function POST(req: NextRequest) {
  // 1. Sesión válida
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Kill switch global (sección 7.3.7)
  if (!(await isAiEnabled())) {
    return NextResponse.json(
      { error: "Generation is under maintenance, please try again later" },
      { status: 503 },
    );
  }

  // 2. Rate limit
  const limited = await enforceAiRateLimit(req, user.id);
  if (limited) return limited;

  // 3. Zod
  const parsed = await parseBody(req, generateScriptInput);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  // Ownership a nivel de app + RLS: nicho propio; formato global o propio
  const { niche, format } = await withDbContext(
    { userId: user.id, role: "user" },
    async (tx) => {
      const [nicheRow] = await tx
        .select()
        .from(niches)
        .where(and(eq(niches.id, input.nicheId), eq(niches.userId, user.id)))
        .limit(1);
      const [formatRow] = await tx
        .select()
        .from(formats)
        .where(eq(formats.id, input.formatId))
        .limit(1);
      return { niche: nicheRow, format: formatRow };
    },
  );
  if (!niche) {
    return NextResponse.json({ error: "Niche not found" }, { status: 404 });
  }
  // RLS ya filtra formats a globales+propios; doble validación en app:
  if (
    !format ||
    format.status !== "active" ||
    (format.ownerScope === "user" && format.userId !== user.id)
  ) {
    return NextResponse.json({ error: "Format not found" }, { status: 404 });
  }

  // 4. Token antes de llamar a Claude
  try {
    await consumeTokens(user.id, 1, "generation");
  } catch (err) {
    if (err instanceof InsufficientTokensError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    throw err;
  }

  // 5. Claude con skeleton + brand_voice, salida validada según tipo
  try {
    const userContent = [
      wrapUserData("skeleton_formato", JSON.stringify(format.skeleton)),
      wrapUserData(
        "perfil_nicho",
        JSON.stringify({
          name: niche.name,
          audience: niche.audience,
          offer: niche.offer,
          cta_word: niche.ctaWord,
          language: niche.language,
          brand_voice: niche.brandVoice,
        }),
      ),
      `Tipo de contenido a generar: ${input.contentType}`,
    ].join("\n\n");

    const output = await callClaudeJson({
      system: generatorSystem(input.contentType),
      user: userContent,
      schema: scriptOutputByType[input.contentType],
    });

    // 6. Guardar en scripts
    const [script] = await withDbContext({ userId: user.id, role: "user" }, (tx) =>
      tx
        .insert(scripts)
        .values({
          userId: user.id,
          nicheId: niche.id,
          formatId: format.id,
          contentType: input.contentType,
          title: output.title,
          sections: output.sections,
          covers: output.covers ?? null,
          caption: output.caption,
          hashtags: output.hashtags,
        })
        .returning(),
    );

    return NextResponse.json({ script }, { status: 201 });
  } catch (err) {
    await grantTokens(user.id, 1, "refund");
    if (err instanceof AiOutputError) {
      return NextResponse.json(
        { error: "The AI did not return a valid script, your credit was refunded" },
        { status: 502 },
      );
    }
    throw err;
  }
}
