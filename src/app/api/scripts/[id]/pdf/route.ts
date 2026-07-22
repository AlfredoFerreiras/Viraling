import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { createElement } from "react";
import { z } from "zod";
import { withDbContext } from "@/db/context";
import { formats, niches, scripts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getServerDict } from "@/lib/i18n/server";
import { ScriptPdf, type ScriptPdfData } from "@/lib/pdf/script-pdf";
import { uuidSchema } from "@/lib/validations";

/**
 * GET /api/scripts/[id]/pdf (bloque 7): genera el PDF bajo demanda,
 * server-side, sin almacenarlo (el pdf_key del schema queda para después).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const idParsed = uuidSchema.safeParse((await params).id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const [row] = await withDbContext({ userId: user.id, role: "user" }, (tx) =>
    tx
      .select({
        script: scripts,
        formatName: formats.name,
        nicheName: niches.name,
      })
      .from(scripts)
      .leftJoin(formats, eq(formats.id, scripts.formatId))
      .leftJoin(niches, eq(niches.id, scripts.nicheId))
      .where(and(eq(scripts.id, idParsed.data), eq(scripts.userId, user.id)))
      .limit(1),
  );
  if (!row) {
    return NextResponse.json({ error: "Guion no encontrado" }, { status: 404 });
  }

  const { dict } = await getServerDict();
  const data: ScriptPdfData = {
    title: row.script.title ?? "Guion",
    contentType: row.script.contentType as ScriptPdfData["contentType"],
    formatName: row.formatName,
    nicheName: row.nicheName,
    sections: row.script.sections,
    covers: row.script.covers as ScriptPdfData["covers"],
    caption: row.script.caption,
    hashtags: row.script.hashtags,
    labels: {
      sections: dict["script.sections"],
      onScreen: dict["script.onScreen"],
      covers: dict["script.covers"],
      caption: dict["script.caption"],
      hashtags: dict["script.hashtags"],
      slide: dict["script.slide"],
      story: dict["script.story"],
    },
  };

  const buffer = await renderToBuffer(
    createElement(ScriptPdf, { data }) as React.ReactElement<DocumentProps>,
  );

  const safeName = (row.script.title ?? "guion")
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .slice(0, 60)
    .trim() || "guion";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
    },
  });
}
