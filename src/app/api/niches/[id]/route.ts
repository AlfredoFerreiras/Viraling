import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withDbContext } from "@/db/context";
import { formats, niches, scripts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { parseBody, uuidSchema } from "@/lib/validations";
import { nicheUpdateInput } from "@/lib/validations/niches";

async function validId(id: string): Promise<string | null> {
  const parsed = z.object({ id: uuidSchema }).safeParse({ id });
  return parsed.success ? parsed.data.id : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const id = await validId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const parsed = await parseBody(req, nicheUpdateInput);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  const [updated] = await withDbContext({ userId: user.id, role: "user" }, (tx) =>
    tx
      .update(niches)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.language !== undefined && { language: input.language }),
        ...(input.audience !== undefined && { audience: input.audience }),
        ...(input.offer !== undefined && { offer: input.offer }),
        ...(input.brandVoice !== undefined && {
          brandVoice: input.brandVoice,
          ctaWord: input.brandVoice.cta_word,
        }),
      })
      // RLS también filtra; doble capa de ownership
      .where(and(eq(niches.id, id), eq(niches.userId, user.id)))
      .returning(),
  );

  if (!updated) {
    return NextResponse.json({ error: "Niche not found" }, { status: 404 });
  }
  return NextResponse.json({ niche: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const id = await validId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const deleted = await withDbContext(
    { userId: user.id, role: "user" },
    async (tx) => {
      // Sin cascade en las FKs de scripts/formats: limpiar dependencias
      // primero, dentro de la misma transacción (RLS limita a filas propias).
      await tx.delete(scripts).where(eq(scripts.nicheId, id));
      await tx
        .update(formats)
        .set({ nicheId: null })
        .where(eq(formats.nicheId, id));
      return tx
        .delete(niches)
        .where(and(eq(niches.id, id), eq(niches.userId, user.id)))
        .returning({ id: niches.id });
    },
  );

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Niche not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
