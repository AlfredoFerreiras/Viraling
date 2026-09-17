import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BuildNote } from "@/components/build-note";
import { Badge, Card, EmptyState } from "@/components/ui";
import { withDbContext } from "@/db/context";
import { scripts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getServerDict } from "@/lib/i18n/server";
import { getUserNiches } from "@/lib/niches";

const typeColor = {
  reel: "rose",
  carousel: "sky",
  story: "amber",
} as const;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const { dict } = await getServerDict();
  const userNiches = await getUserNiches(user.id);
  if (userNiches.length === 0) redirect("/onboarding");

  const recent = await withDbContext({ userId: user.id, role: "user" }, (tx) =>
    tx
      .select()
      .from(scripts)
      .where(eq(scripts.userId, user.id))
      .orderBy(desc(scripts.createdAt))
      .limit(6),
  );

  const actions = [
    {
      href: "/generate",
      icon: "✨",
      title: dict["dash.generate.title"],
      desc: dict["dash.generate.desc"],
    },
    {
      href: "/extract",
      icon: "🧬",
      title: dict["dash.extract.title"],
      desc: dict["dash.extract.desc"],
    },
    {
      href: "/history",
      icon: "🗂️",
      title: dict["dash.history.title"],
      desc: dict["dash.history.desc"],
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {dict["dash.hello"]}, {user.email.split("@")[0]} 👋
          </h1>
        </div>
        <div className="flex gap-3 text-sm">
          <Card className="px-4 py-2.5">
            <span className="text-zinc-400">{dict["dash.tokens"]}: </span>
            <span className="font-bold text-amber-300">{user.tokensBalance}</span>
          </Card>
          <Card className="px-4 py-2.5">
            <span className="text-zinc-400">{dict["dash.plan"]}: </span>
            <span className="font-bold capitalize">{user.plan}</span>
          </Card>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {dict["dash.quick"]}
      </h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {actions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-amber-400/40">
              <div className="mb-2 text-2xl">{a.icon}</div>
              <h3 className="font-semibold">{a.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{a.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {dict["dash.recent"]}
      </h2>
      {recent.length === 0 ? (
        <EmptyState
          title={dict["dash.empty"]}
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((s) => (
            <Link key={s.id} href={`/scripts/${s.id}`}>
              <Card className="h-full transition hover:border-amber-400/40">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge color={typeColor[s.contentType as keyof typeof typeColor] ?? "zinc"}>
                    {dict[`gen.type.${s.contentType}` as "gen.type.reel"] ?? s.contentType}
                  </Badge>
                  <span className="text-xs text-zinc-500">
                    {s.createdAt?.toLocaleDateString()}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm font-medium">{s.title}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <BuildNote
          title={dict["note.dashboard.title"]}
          tags={["Postgres RLS", "Ledger", "Drizzle"]}
        >
          {dict["note.dashboard.desc"]}
        </BuildNote>
      </div>
    </main>
  );
}
