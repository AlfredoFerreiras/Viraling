import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, EmptyState } from "@/components/ui";
import { NicheDeleteButton } from "@/components/niche-delete-button";
import { getCurrentUser } from "@/lib/auth";
import { getServerDict } from "@/lib/i18n/server";
import { getActiveNiche, getUserNiches } from "@/lib/niches";

export default async function NichesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { dict } = await getServerDict();

  const userNiches = await getUserNiches(user.id);
  const active = await getActiveNiche(userNiches);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {dict["niches.title"]}
        </h1>
        <Link
          href="/onboarding"
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
        >
          + {dict["niches.new"]}
        </Link>
      </div>

      {userNiches.length === 0 ? (
        <EmptyState title={dict["niches.empty"]} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {userNiches.map((n) => (
            <Card key={n.id}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="font-semibold">{n.name}</h2>
                <div className="flex items-center gap-2">
                  {active?.id === n.id && (
                    <Badge color="amber">{dict["niches.active"]}</Badge>
                  )}
                  <Badge>{n.language?.toUpperCase()}</Badge>
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-zinc-400">
                {n.offer ?? "—"}
              </p>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <Link
                  href={`/niches/${n.id}/edit`}
                  className="text-amber-300 hover:underline"
                >
                  {dict["niches.edit"]}
                </Link>
                <NicheDeleteButton
                  nicheId={n.id}
                  label={dict["niches.delete"]}
                  confirmText={dict["niches.deleteConfirm"]}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
