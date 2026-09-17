import { desc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { withDbContext } from "@/db/context";
import { niches } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { parseBody } from "@/lib/validations";
import { nicheInput } from "@/lib/validations/niches";

/** Niche limit per plan (section 10). */
const NICHE_LIMITS: Record<string, number> = {
  free: 1,
  pro: 3,
  pro_editor: 3,
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rows = await withDbContext({ userId: user.id, role: "user" }, (tx) =>
    tx
      .select()
      .from(niches)
      .where(eq(niches.userId, user.id))
      .orderBy(desc(niches.createdAt)),
  );
  return NextResponse.json({ niches: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = await parseBody(req, nicheInput);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  const created = await withDbContext(
    { userId: user.id, role: "user" },
    async (tx) => {
      const existing = await tx
        .select({ id: niches.id })
        .from(niches)
        .where(eq(niches.userId, user.id));
      const limit = user.role === "admin" ? Infinity : (NICHE_LIMITS[user.plan] ?? 1);
      if (existing.length >= limit) {
        return null;
      }
      const [row] = await tx
        .insert(niches)
        .values({
          userId: user.id,
          name: input.name,
          language: input.language,
          audience: input.audience ?? input.brandVoice.ideal_client,
          offer: input.offer ?? input.brandVoice.sells,
          ctaWord: input.brandVoice.cta_word,
          brandVoice: input.brandVoice,
        })
        .returning();
      return row;
    },
  );

  if (!created) {
    return NextResponse.json(
      { error: "You reached the niche limit of your plan" },
      { status: 403 },
    );
  }
  return NextResponse.json({ niche: created }, { status: 201 });
}
