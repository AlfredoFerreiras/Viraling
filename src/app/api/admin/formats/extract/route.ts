import { NextResponse, type NextRequest } from "next/server";
import { AiOutputError, callClaudeJson, wrapUserData } from "@/lib/ai/claude";
import { EXTRACTOR_SYSTEM } from "@/lib/ai/prompts";
import { adminGuard } from "@/lib/admin";
import { parseBody } from "@/lib/validations";
import { extractFormatInput, skeletonOutput } from "@/lib/validations/ai";

/**
 * Extractor para admin (bloque 8.3): mismo prompt del extractor pero SIN
 * consumir tokens del admin y sin guardar — devuelve el skeleton propuesto
 * para que el admin lo edite y publique.
 */
export async function POST(req: NextRequest) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const parsed = await parseBody(req, extractFormatInput);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

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

    return NextResponse.json({ skeleton });
  } catch (err) {
    if (err instanceof AiOutputError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    throw err;
  }
}
