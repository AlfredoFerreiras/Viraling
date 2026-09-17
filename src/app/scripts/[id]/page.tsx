import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { Badge, Card } from "@/components/ui";
import { withDbContext } from "@/db/context";
import { formats, scripts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getServerDict } from "@/lib/i18n/server";

/** Colors per section (the same ones as the PDF). */
const SECTION_STYLE: Record<string, { border: string; badge: "rose" | "sky" | "orange" | "emerald" | "amber" }> = {
  hook: { border: "border-l-rose-400", badge: "rose" },
  context: { border: "border-l-sky-400", badge: "sky" },
  problem: { border: "border-l-orange-400", badge: "orange" },
  solution: { border: "border-l-emerald-400", badge: "emerald" },
  cta: { border: "border-l-amber-400", badge: "amber" },
};

type ReelSection = {
  section: string;
  time_start: number;
  time_end: number;
  spoken: string;
  on_screen: string[];
};
type CarouselSection = { slide: number; title: string; body: string; is_cta: boolean };
type StorySection = { story: number; purpose: string; spoken: string; on_screen: string[] };
type Cover = { white_text: string; yellow_text: string };

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { dict } = await getServerDict();

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [row] = await withDbContext({ userId: user.id, role: "user" }, (tx) =>
    tx
      .select({ script: scripts, formatName: formats.name })
      .from(scripts)
      .leftJoin(formats, eq(formats.id, scripts.formatId))
      .where(and(eq(scripts.id, id), eq(scripts.userId, user.id)))
      .limit(1),
  );
  if (!row) notFound();
  const script = row.script;
  const covers = (script.covers ?? null) as Cover[] | null;

  const sectionLabel = (key: string) =>
    dict[`script.section.${key}` as "script.section.hook"] ?? key;
  const purposeLabel = (key: string) =>
    dict[`script.purpose.${key}` as "script.purpose.cta"] ?? key;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge color="amber">
              {dict[`gen.type.${script.contentType}` as "gen.type.reel"]}
            </Badge>
            {row.formatName && <Badge>{row.formatName}</Badge>}
          </div>
          <h1 className="text-balance text-2xl font-bold tracking-tight">
            {script.title}
          </h1>
        </div>
        <a
          href={`/api/scripts/${script.id}/pdf`}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
        >
          ⬇ {dict["script.pdf"]}
        </a>
      </div>

      {/* Secciones */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {dict["script.sections"]}
      </h2>
      <div className="mb-10 space-y-3">
        {script.contentType === "reel" &&
          (script.sections as ReelSection[]).map((s) => {
            const style = SECTION_STYLE[s.section] ?? SECTION_STYLE.hook;
            return (
              <Card key={s.section} className={`border-l-4 ${style.border}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge color={style.badge}>{sectionLabel(s.section)}</Badge>
                    <span className="font-mono text-xs text-zinc-500">
                      {s.time_start}s – {s.time_end}s
                    </span>
                  </div>
                  <CopyButton text={s.spoken} />
                </div>
                <p className="text-sm leading-relaxed">{s.spoken}</p>
                {s.on_screen.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-zinc-500">
                      {dict["script.onScreen"]}:
                    </span>
                    {s.on_screen.map((txt, i) => (
                      <span
                        key={i}
                        className="rounded bg-white/8 px-2 py-0.5 font-mono text-xs text-zinc-300"
                      >
                        {txt}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}

        {script.contentType === "carousel" &&
          (script.sections as CarouselSection[]).map((s) => (
            <Card
              key={s.slide}
              className={`border-l-4 ${s.is_cta ? "border-l-amber-400" : "border-l-sky-400"}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge color={s.is_cta ? "amber" : "sky"}>
                    {dict["script.slide"]} {s.slide}
                    {s.is_cta ? " · CTA" : ""}
                  </Badge>
                </div>
                <CopyButton text={`${s.title}\n\n${s.body}`} />
              </div>
              <p className="mb-1 text-sm font-semibold">{s.title}</p>
              <p className="text-sm leading-relaxed text-zinc-300">{s.body}</p>
            </Card>
          ))}

        {script.contentType === "story" &&
          (script.sections as StorySection[]).map((s) => {
            const badgeColor =
              s.purpose === "cta"
                ? "amber"
                : s.purpose === "product"
                  ? "emerald"
                  : s.purpose === "proof"
                    ? "sky"
                    : "rose";
            return (
              <Card key={s.story} className="border-l-4 border-l-violet-400">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge>{`${dict["script.story"]} ${s.story}`}</Badge>
                    <Badge color={badgeColor}>{purposeLabel(s.purpose)}</Badge>
                  </div>
                  <CopyButton text={s.spoken} />
                </div>
                <p className="text-sm leading-relaxed">{s.spoken}</p>
                {s.on_screen.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-zinc-500">
                      {dict["script.onScreen"]}:
                    </span>
                    {s.on_screen.map((txt, i) => (
                      <span
                        key={i}
                        className="rounded bg-white/8 px-2 py-0.5 font-mono text-xs text-zinc-300"
                      >
                        {txt}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
      </div>

      {/* Portadas blanco/amarillo */}
      {covers && covers.length > 0 && (
        <>
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {dict["script.covers"]}
            </h2>
            <span className="text-xs text-zinc-600">
              {dict["script.coversHint"]}
            </span>
          </div>
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            {covers.map((c, i) => (
              <div
                key={i}
                className="relative flex aspect-[4/5] flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-950 p-5 text-center"
              >
                <p className="text-balance text-lg font-extrabold uppercase leading-tight text-white">
                  {c.white_text}{" "}
                  <span className="text-amber-400">{c.yellow_text}</span>
                </p>
                <div className="absolute right-2 top-2">
                  <CopyButton text={`${c.white_text} ${c.yellow_text}`} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Caption + hashtags */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {dict["script.caption"]}
            </h3>
            <CopyButton text={script.caption ?? ""} />
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {script.caption}
          </p>
        </Card>
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {dict["script.hashtags"]}
            </h3>
            <CopyButton text={(script.hashtags ?? []).join(" ")} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(script.hashtags ?? []).map((h) => (
              <span
                key={h}
                className="rounded bg-sky-400/10 px-2 py-0.5 text-xs text-sky-300"
              >
                {h}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Link href="/history" className="text-sm text-zinc-400 hover:text-white">
          ← {dict["hist.title"]}
        </Link>
      </div>
    </main>
  );
}
