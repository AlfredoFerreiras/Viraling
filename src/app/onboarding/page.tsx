import { redirect } from "next/navigation";
import { NicheForm } from "@/components/niche-form";
import { getCurrentUser } from "@/lib/auth";
import { getServerDict } from "@/lib/i18n/server";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { dict } = await getServerDict();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{dict["onb.title"]}</h1>
        <p className="mt-2 text-sm text-zinc-400">{dict["onb.subtitle"]}</p>
      </div>
      <NicheForm mode="wizard" />
    </main>
  );
}
