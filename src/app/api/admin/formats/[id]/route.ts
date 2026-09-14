import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withDbContext } from "@/db/context";
import { formats } from "@/db/schema";
import { adminGuard } from "@/lib/admin";
import { contentTypeSchema, parseBody, uuidSchema } from "@/lib/validations";
import { skeletonOutput } from "@/lib/validations/ai";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  contentType: contentTypeSchema.optional(),
  skeleton: skeletonOutput.optional(),
  performanceNotes: z.string().max(2000).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

/** Editar / activar / desactivar un formato global. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const idParsed = uuidSchema.safeParse((await params).id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const parsed = await parseBody(req, patchSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  const [updated] = await withDbContext(
    { userId: guard.admin.id, role: "admin" },
    (tx) =>
      tx
        .update(formats)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.contentType !== undefined && { contentType: input.contentType }),
          ...(input.skeleton !== undefined && { skeleton: input.skeleton }),
          ...(input.performanceNotes !== undefined && {
            performanceNotes: input.performanceNotes,
          }),
          ...(input.status !== undefined && { status: input.status }),
        })
        .where(
          and(eq(formats.id, idParsed.data), eq(formats.ownerScope, "global")),
        )
        .returning(),
  );

  if (!updated) {
    return NextResponse.json({ error: "Format not found" }, { status: 404 });
  }
  return NextResponse.json({ format: updated });
}
