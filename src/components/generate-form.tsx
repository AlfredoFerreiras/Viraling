"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "./i18n-provider";
import { Badge, Button, Card, Label, Select, Spinner, cx } from "./ui";

type FormatItem = {
  id: string;
  name: string;
  ownerScope: string;
  contentType: string;
  skeleton: { hook_type?: string; replicable_rules?: string[] } | null;
};

const TYPES = ["reel", "carousel", "story"] as const;
const TYPE_ICON = { reel: "🎬", carousel: "🖼️", story: "📱" } as const;

export function GenerateForm({
  niches,
  activeNicheId,
  tokensBalance,
}: {
  niches: { id: string; name: string }[];
  activeNicheId: string;
  tokensBalance: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [nicheId, setNicheId] = useState(activeNicheId);
  const [contentType, setContentType] = useState<(typeof TYPES)[number]>("reel");
  // Formats are keyed by the content type they were loaded for, so a
  // type change shows the loading state without a synchronous reset.
  const [loaded, setLoaded] = useState<{
    type: string;
    items: FormatItem[];
  } | null>(null);
  const formats = loaded?.type === contentType ? loaded.items : null;
  const [formatId, setFormatId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!generating) return;
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, 2)), 6000);
    return () => clearInterval(timer);
  }, [generating]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/formats?contentType=${contentType}`)
      .then(async (res) => {
        const items: FormatItem[] = res.ok ? (await res.json()).formats : [];
        if (!cancelled) setLoaded({ type: contentType, items });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ type: contentType, items: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [contentType]);

  function selectType(ty: (typeof TYPES)[number]) {
    setContentType(ty);
    setFormatId(null);
  }

  async function generate() {
    if (!formatId) return;
    setStage(0);
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formatId, nicheId, contentType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.error"));
        return;
      }
      router.push(`/scripts/${data.script.id}`);
      router.refresh();
    } catch {
      setError(t("common.error"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("gen.niche")}</Label>
          <Select value={nicheId} onChange={(e) => setNicheId(e.target.value)}>
            {niches.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t("gen.type")}</Label>
          <div className="flex gap-2">
            {TYPES.map((ty) => (
              <button
                key={ty}
                onClick={() => selectType(ty)}
                className={cx(
                  "flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm transition",
                  contentType === ty
                    ? "border-amber-400/60 bg-amber-400/10 font-semibold text-amber-300"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10",
                )}
              >
                {TYPE_ICON[ty]} {t(`gen.type.${ty}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label>{t("gen.format")}</Label>
        {formats === null ? (
          <div className="flex items-center gap-2 py-8 text-sm text-zinc-500">
            <Spinner /> {t("common.loading")}
          </div>
        ) : formats.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-500">
            {t("gen.noFormats")}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {formats.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormatId(f.id)}
                className={cx(
                  "cursor-pointer rounded-xl border p-4 text-left transition",
                  formatId === f.id
                    ? "border-amber-400/70 bg-amber-400/10"
                    : "border-white/10 bg-card hover:border-white/25",
                )}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{f.name}</span>
                  <Badge color={f.ownerScope === "global" ? "sky" : "emerald"}>
                    {f.ownerScope === "global"
                      ? t("gen.formatGlobal")
                      : t("gen.formatMine")}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-xs text-zinc-400">
                  {f.skeleton?.hook_type ?? f.skeleton?.replicable_rules?.[0] ?? ""}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-zinc-400">
          {tokensBalance > 0 ? (
            <>
              {t("gen.cost")}{" "}
              <span className="font-bold text-amber-300">{tokensBalance}</span>
            </>
          ) : (
            <span className="text-red-400">{t("gen.noTokens")}</span>
          )}
        </p>
        <Button
          onClick={generate}
          disabled={!formatId || generating || tokensBalance <= 0}
          className="px-6"
        >
          {generating && <Spinner />}
          {generating
            ? t(["gen.stage1", "gen.stage2", "gen.stage3"][stage] as "gen.stage1")
            : `✨ ${t("gen.button")}`}
        </Button>
      </Card>
    </div>
  );
}
