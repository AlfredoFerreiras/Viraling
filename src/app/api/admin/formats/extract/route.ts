import { NextResponse, type NextRequest } from "next/server";
import { AiOutputError, callClaudeJson, wrapUserData } from "@/lib/ai/claude";
import { EXTRACTOR_SYSTEM } from "@/lib/ai/prompts";
import { adminGuard } from "@/lib/admin";
import { parseBody } from "@/lib/validations";
import { extractFormatInput, skeletonOutput } from "@/lib/validations/ai";

/**
 * Extractor for admin (block 8.3): the same extractor prompt but WITHOUT
 * spending admin tokens and without saving. It returns the proposed
 * skeleton so the admin can edit and publish it.
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
