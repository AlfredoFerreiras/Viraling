import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Patrón de validación (sección 7.2): ningún route handler toca la DB
 * sin pasar por Zod. Cada handler importa su schema de esta carpeta y
 * llama parseBody; si falla, responde 400 con errores claros.
 *
 * Uso:
 *   const parsed = await parseBody(req, miSchema);
 *   if (!parsed.ok) return parsed.response;
 *   // parsed.data está tipado y validado
 */
export async function parseBody<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<
  { ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }
> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Body must be valid JSON" },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join(".") || "(root)",
            message: issue.message,
          })),
        },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}

// uuids validados como uuid, no como string libre (sección 7.2)
export const uuidSchema = z.uuid();

export const contentTypeSchema = z.enum(["reel", "carousel", "story"]);
