import { and, desc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withDbContext } from "@/db/context";
import { formats } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { contentTypeSchema } from "@/lib/validations";

const querySchema = z.object({
  contentType: contentTypeSchema.optional(),
});

/** Galería de formatos: globales + propios (la policy formats_read filtra). */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = querySchema.safeParse({
    contentType: req.nextUrl.searchParams.get("contentType") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "contentType inválido" }, { status: 400 });
  }
  const { contentType } = parsed.data;

  const rows = await withDbContext({ userId: user.id, role: "user" }, (tx) =>
    tx
      .select({
        id: formats.id,
        name: formats.name,
        ownerScope: formats.ownerScope,
        contentType: formats.contentType,
        skeleton: formats.skeleton,
      })
      .from(formats)
      .where(
        contentType
          ? and(eq(formats.status, "active"), eq(formats.contentType, contentType))
          : eq(formats.status, "active"),
      )
      .orderBy(desc(formats.createdAt)),
  );

  return NextResponse.json({ formats: rows });
}
