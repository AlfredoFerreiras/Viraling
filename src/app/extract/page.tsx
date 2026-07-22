import { redirect } from "next/navigation";
import { ExtractForm } from "@/components/extract-form";
import { getCurrentUser } from "@/lib/auth";
import { getServerDict } from "@/lib/i18n/server";
import { getUserNiches } from "@/lib/niches";

export default async function ExtractPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { dict } = await getServerDict();
  const userNiches = await getUserNiches(user.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{dict["ext.title"]}</h1>
        <p className="mt-1 text-sm text-zinc-400">{dict["ext.subtitle"]}</p>
      </div>
      <ExtractForm
        niches={userNiches.map((n) => ({ id: n.id, name: n.name }))}
      />
    </main>
  );
}
