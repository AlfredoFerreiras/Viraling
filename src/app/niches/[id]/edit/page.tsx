import { notFound, redirect } from "next/navigation";
import { NicheForm, type NicheFormValues } from "@/components/niche-form";
import { getCurrentUser } from "@/lib/auth";
import { getServerDict } from "@/lib/i18n/server";
import { getUserNiches } from "@/lib/niches";
import { brandVoiceSchema } from "@/lib/validations/niches";

export default async function EditNichePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { dict } = await getServerDict();

  const { id } = await params;
  const niche = (await getUserNiches(user.id)).find((n) => n.id === id);
  if (!niche) notFound();

  const parsedBv = brandVoiceSchema.safeParse(niche.brandVoice);
  const initial: NicheFormValues = {
    name: niche.name,
    language: niche.language === "en" ? "en" : "es",
    brandVoice: parsedBv.success
      ? parsedBv.data
      : {
          sells: niche.offer ?? "",
          ideal_client: niche.audience ?? "",
          transformation: "",
          tone: "",
          never_say: "",
          cta_word: niche.ctaWord ?? "",
          success_cases: "",
          recordings_per_week: 3,
        },
  };

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        {dict["niches.edit"]}: {niche.name}
      </h1>
      <NicheForm mode="full" nicheId={niche.id} initial={initial} />
    </main>
  );
}
