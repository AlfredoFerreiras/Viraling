import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { withDbContext } from "@/db/context";
import { niches } from "@/db/schema";

export const NICHE_COOKIE = "fb_niche";

export type Niche = typeof niches.$inferSelect;

export async function getUserNiches(userId: string): Promise<Niche[]> {
  return withDbContext({ userId, role: "user" }, (tx) =>
    tx
      .select()
      .from(niches)
      .where(eq(niches.userId, userId))
      .orderBy(desc(niches.createdAt)),
  );
}

/** Nicho activo: cookie fb_niche si pertenece al user, si no el primero. */
export async function getActiveNiche(
  userNiches: Niche[],
): Promise<Niche | null> {
  if (userNiches.length === 0) return null;
  const store = await cookies();
  const cookieId = store.get(NICHE_COOKIE)?.value;
  return userNiches.find((n) => n.id === cookieId) ?? userNiches[0];
}
