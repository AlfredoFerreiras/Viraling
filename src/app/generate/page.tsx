import { redirect } from "next/navigation";
import { GenerateForm } from "@/components/generate-form";
import { getCurrentUser } from "@/lib/auth";
import { getServerDict } from "@/lib/i18n/server";
import { getActiveNiche, getUserNiches } from "@/lib/niches";

export default async function GeneratePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { dict } = await getServerDict();

  const userNiches = await getUserNiches(user.id);
  if (userNiches.length === 0) redirect("/onboarding");
  const active = await getActiveNiche(userNiches);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{dict["gen.title"]}</h1>
        <p className="mt-1 text-sm text-zinc-400">{dict["gen.subtitle"]}</p>
      </div>
      <GenerateForm
        niches={userNiches.map((n) => ({ id: n.id, name: n.name }))}
        activeNicheId={active!.id}
        tokensBalance={user.tokensBalance}
      />
    </main>
  );
}
