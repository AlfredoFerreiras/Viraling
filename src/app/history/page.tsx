import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BuildNote } from "@/components/build-note";
import { Badge, Card, EmptyState } from "@/components/ui";
import { withDbContext } from "@/db/context";
import { formats, scripts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getServerDict } from "@/lib/i18n/server";
import { getActiveNiche, getUserNiches } from "@/lib/niches";

const typeColor = { reel: "rose", carousel: "sky", story: "amber" } as const;

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { dict } = await getServerDict();

  const userNiches = await getUserNiches(user.id);
  if (userNiches.length === 0) redirect("/onboarding");
  const active = await getActiveNiche(userNiches);

  const rows = await withDbContext({ userId: user.id, role: "user" }, (tx) =>
    tx
      .select({ script: scripts, formatName: formats.name })
      .from(scripts)
      .leftJoin(formats, eq(formats.id, scripts.formatId))
      .where(and(eq(scripts.userId, user.id), eq(scripts.nicheId, active!.id)))
      .orderBy(desc(scripts.createdAt)),
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {dict["hist.title"]}
        </h1>
        <Badge color="amber">{active!.name}</Badge>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={dict["hist.empty"]}
          action={
            <Link
              href="/generate"
              className="text-sm font-medium text-amber-300 hover:underline"
            >
              {dict["dash.emptyCta"]} →
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map(({ script: s, formatName }) => (
            <Link key={s.id} href={`/scripts/${s.id}`} className="block">
              <Card className="flex items-center justify-between gap-4 transition hover:border-amber-400/40">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge
                      color={typeColor[s.contentType as keyof typeof typeColor] ?? "zinc"}
                    >
                      {dict[`gen.type.${s.contentType}` as "gen.type.reel"]}
                    </Badge>
                    {formatName && <Badge>{formatName}</Badge>}
                    <span className="text-xs text-zinc-500">
                      {s.createdAt?.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium">{s.title}</p>
                </div>
                <span className="shrink-0 text-sm text-amber-300">
                  {dict["hist.view"]} →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <BuildNote
          title={dict["note.history.title"]}
          tags={["Seed data", "Drizzle"]}
        >
          {dict["note.history.desc"]}
        </BuildNote>
      </div>
    </main>
  );
}
