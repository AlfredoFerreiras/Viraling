import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Validation pattern (section 7.2): no route handler touches the DB
 * without going through Zod. Each handler imports its schema from this folder
 * and calls parseBody; on failure it answers 400 with clear errors.
 *
 * Uso:
 *   const parsed = await parseBody(req, miSchema);
 *   if (!parsed.ok) return parsed.response;
 *   // parsed.data is typed and validated
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

// uuids validated as uuid, not as free strings (section 7.2)
export const uuidSchema = z.uuid();

export const contentTypeSchema = z.enum(["reel", "carousel", "story"]);
