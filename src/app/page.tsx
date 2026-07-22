import { SignUpButton, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { getServerDict } from "@/lib/i18n/server";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  const { dict } = await getServerDict();

  const features = [
    { title: dict["landing.f1.title"], desc: dict["landing.f1.desc"], icon: "🧠" },
    { title: dict["landing.f2.title"], desc: dict["landing.f2.desc"], icon: "🎙️" },
    { title: dict["landing.f3.title"], desc: dict["landing.f3.desc"], icon: "🎬" },
  ];

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 300px at 50% 0%, rgba(251,191,36,0.12), transparent 70%)",
          }}
        />
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-20 pt-24 text-center">
          <span className="mb-6 rounded-full border border-amber-400/25 bg-amber-400/10 px-3.5 py-1 text-xs font-medium text-amber-300">
            {dict["landing.tagline"]}
          </span>
          <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
            {dict["landing.title1"]}
            <br />
            <span className="bg-linear-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
              {dict["landing.title2"]}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg text-zinc-400">
            {dict["landing.subtitle"]}
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <SignUpButton>
              <button className="cursor-pointer rounded-xl bg-amber-400 px-7 py-3 text-base font-semibold text-zinc-950 shadow-[0_0_40px_-8px_rgba(251,191,36,0.6)] transition hover:bg-amber-300">
                {dict["landing.cta"]}
              </button>
            </SignUpButton>
            <SignInButton>
              <button className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-base text-zinc-200 transition hover:bg-white/10">
                {dict["landing.cta2"]}
              </button>
            </SignInButton>
          </div>
          <p className="mt-4 text-xs text-zinc-500">{dict["landing.free"]}</p>
          <p className="mt-1 text-[11px] text-zinc-600">
            {dict["footer.legal"]}
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-4 pb-24 sm:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="transition hover:border-amber-400/30">
            <div className="mb-3 text-2xl">{f.icon}</div>
            <h3 className="mb-1.5 font-semibold">{f.title}</h3>
            <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
