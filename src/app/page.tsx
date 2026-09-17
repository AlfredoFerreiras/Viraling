import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoButton } from "@/components/demo-button";
import { Card } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { isDemoEnabled } from "@/lib/demo";
import { getServerDict } from "@/lib/i18n/server";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { dict } = await getServerDict();
  const demo = isDemoEnabled();

  const features = [
    { title: dict["landing.f1.title"], desc: dict["landing.f1.desc"], icon: "🧠" },
    { title: dict["landing.f2.title"], desc: dict["landing.f2.desc"], icon: "🎙️" },
    { title: dict["landing.f3.title"], desc: dict["landing.f3.desc"], icon: "🎬" },
  ];

  // The engineering worth reading about, which the screenshots do not show.
  const built = [
    { title: dict["built.rls.title"], desc: dict["built.rls.desc"] },
    { title: dict["built.tokens.title"], desc: dict["built.tokens.desc"] },
    { title: dict["built.ai.title"], desc: dict["built.ai.desc"] },
    { title: dict["built.limits.title"], desc: dict["built.limits.desc"] },
    { title: dict["built.auth.title"], desc: dict["built.auth.desc"] },
    { title: dict["built.pdf.title"], desc: dict["built.pdf.desc"] },
  ];

  const stack = [
    { name: "Next.js 16", note: dict["stack.next"] },
    { name: "TypeScript", note: dict["stack.ts"] },
    { name: "Postgres", note: dict["stack.postgres"] },
    { name: "Drizzle ORM", note: dict["stack.drizzle"] },
    { name: "Claude API", note: dict["stack.claude"] },
    { name: "Zod", note: dict["stack.zod"] },
    { name: "Tailwind CSS", note: dict["stack.tailwind"] },
    { name: "Upstash Redis", note: dict["stack.upstash"] },
    { name: "Netlify", note: dict["stack.netlify"] },
    { name: "Vitest", note: dict["stack.vitest"] },
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

          {demo ? (
            <>
              <div className="mt-10 w-full max-w-xs">
                <DemoButton />
              </div>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-base text-zinc-200 transition hover:bg-white/10"
                >
                  {dict["landing.cta"]}
                </Link>
                <Link
                  href="/sign-in"
                  className="rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-base text-zinc-200 transition hover:bg-white/10"
                >
                  {dict["landing.cta2"]}
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="rounded-xl bg-amber-400 px-7 py-3 text-base font-semibold text-zinc-950 shadow-[0_0_40px_-8px_rgba(251,191,36,0.6)] transition hover:bg-amber-300"
              >
                {dict["landing.cta"]}
              </Link>
              <Link
                href="/sign-in"
                className="rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-base text-zinc-200 transition hover:bg-white/10"
              >
                {dict["landing.cta2"]}
              </Link>
            </div>
          )}

          <p className="mt-4 text-xs text-zinc-500">{dict["landing.free"]}</p>
          <p className="mt-1 text-[11px] text-zinc-600">{dict["footer.legal"]}</p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-4 pb-20 sm:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="transition hover:border-amber-400/30">
            <div className="mb-3 text-2xl">{f.icon}</div>
            <h3 className="mb-1.5 font-semibold">{f.title}</h3>
            <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>
          </Card>
        ))}
      </section>

      <section className="border-t border-white/5 bg-white/2">
        <div className="mx-auto w-full max-w-5xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            {dict["built.title"]}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-center text-zinc-400">
            {dict["built.subtitle"]}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {built.map((b) => (
              <Card key={b.title}>
                <h3 className="mb-1.5 font-semibold text-amber-200">{b.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{b.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {dict["stack.title"]}
        </h2>
        <p className="mt-3 text-center text-zinc-400">{dict["stack.subtitle"]}</p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stack.map((s) => (
            <li
              key={s.name}
              className="rounded-xl border border-white/10 bg-white/3 px-4 py-3"
            >
              <p className="text-sm font-semibold">{s.name}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{s.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
