import { desc, ilike } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { withDbContext } from "@/db/context";
import { users } from "@/db/schema";
import { adminGuard } from "@/lib/admin";

/** Tabla de usuarios con búsqueda por email (bloque 8.4). */
export async function GET(req: NextRequest) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 200);

  const rows = await withDbContext(
    { userId: guard.admin.id, role: "admin" },
    (tx) => {
      const base = tx
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          plan: users.plan,
          tokensBalance: users.tokensBalance,
          createdAt: users.createdAt,
        })
        .from(users);
      return (q ? base.where(ilike(users.email, `%${q}%`)) : base)
        .orderBy(desc(users.createdAt))
        .limit(100);
    },
  );

  return NextResponse.json({ users: rows });
}
