import { desc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withDbContext } from "@/db/context";
import { formats } from "@/db/schema";
import { adminGuard } from "@/lib/admin";
import { contentTypeSchema, parseBody } from "@/lib/validations";
import { skeletonOutput } from "@/lib/validations/ai";

const publishSchema = z.object({
  name: z.string().min(2).max(120),
  contentType: contentTypeSchema,
  skeleton: skeletonOutput,
  sourceTranscript: z.string().max(15000).optional(),
  referenceImages: z.array(z.string().max(500)).max(10).default([]),
  performanceNotes: z.string().max(2000).optional(),
});

/** List of global formats (includes inactive ones, so they can be managed). */
export async function GET() {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const rows = await withDbContext(
    { userId: guard.admin.id, role: "admin" },
    (tx) =>
      tx
        .select()
        .from(formats)
        .where(eq(formats.ownerScope, "global"))
        .orderBy(desc(formats.createdAt)),
  );
  return NextResponse.json({ formats: rows });
}

/** Publicar formato global (bloque 8.3). */
export async function POST(req: NextRequest) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const parsed = await parseBody(req, publishSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  const [row] = await withDbContext(
    { userId: guard.admin.id, role: "admin" },
    (tx) =>
      tx
        .insert(formats)
        .values({
          ownerScope: "global",
          userId: null,
          name: input.name,
          contentType: input.contentType,
          skeleton: input.skeleton,
          sourceTranscript: input.sourceTranscript ?? null,
          referenceImages: input.referenceImages,
          performanceNotes: input.performanceNotes ?? null,
          status: "active",
        })
        .returning(),
  );

  return NextResponse.json({ format: row }, { status: 201 });
}
