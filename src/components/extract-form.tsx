"use client";

import { useState } from "react";
import { useI18n } from "./i18n-provider";
import { Badge, Button, Card, Input, Label, Select, Spinner, Textarea } from "./ui";

type Skeleton = {
  name: string;
  structure: { section: string; purpose: string; relative_duration: string }[];
  hook_type: string;
  pacing: string;
  visual_elements: string[];
  cta_type: string;
  replicable_rules: string[];
};

export function ExtractForm({
  niches,
}: {
  niches: { id: string; name: string }[];
}) {
  const { t } = useI18n();
  const [transcript, setTranscript] = useState("");
  const [visual, setVisual] = useState("");
  const [name, setName] = useState("");
  const [contentType, setContentType] = useState("reel");
  const [nicheId, setNicheId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Skeleton | null>(null);

  async function extract() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/extract-format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          visualDescription: visual || undefined,
          name: name || undefined,
          contentType,
          nicheId: nicheId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.error"));
        return;
      }
      setResult(data.format.skeleton as Skeleton);
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div>
          <Label>{t("ext.transcript")}</Label>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={t("ext.transcriptPh")}
            className="min-h-40"
            maxLength={15000}
          />
          <p className="mt-1 text-right text-xs text-zinc-600">
            {transcript.length} / 15000
          </p>
        </div>
        <div>
          <Label>{t("ext.visual")}</Label>
          <Textarea
            value={visual}
            onChange={(e) => setVisual(e.target.value)}
            placeholder={t("ext.visualPh")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>{t("ext.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>{t("ext.type")}</Label>
            <Select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              <option value="reel">{t("gen.type.reel")}</option>
              <option value="carousel">{t("gen.type.carousel")}</option>
              <option value="story">{t("gen.type.story")}</option>
            </Select>
          </div>
          <div>
            <Label>{t("ext.niche")}</Label>
            <Select value={nicheId} onChange={(e) => setNicheId(e.target.value)}>
              <option value="">{t("ext.none")}</option>
              {niches.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end">
          <Button onClick={extract} disabled={busy || transcript.trim().length < 50}>
            {busy && <Spinner />}
            {busy ? t("ext.extracting") : `🧬 ${t("ext.button")}`}
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="space-y-4 border-emerald-400/30">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">
              {t("ext.preview")}: <span className="text-amber-300">{result.name}</span>
            </h2>
            <Badge color="emerald">✓</Badge>
          </div>
          <p className="text-sm text-emerald-300">{t("ext.saved")}</p>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("ext.structure")}
            </h3>
            <div className="space-y-1.5">
              {result.structure.map((s, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-amber-300">{s.section}</span>
                  <span className="flex-1 text-zinc-400">{s.purpose}</span>
                  <span className="font-mono text-xs text-zinc-500">
                    {s.relative_duration}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-zinc-500">{t("ext.hook")}: </span>
              {result.hook_type}
            </div>
            <div>
              <span className="text-zinc-500">{t("ext.pacing")}: </span>
              {result.pacing}
            </div>
            <div>
              <span className="text-zinc-500">{t("ext.ctaType")}: </span>
              {result.cta_type}
            </div>
            <div>
              <span className="text-zinc-500">{t("ext.visualEls")}: </span>
              {result.visual_elements.join(", ")}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("ext.rules")}
            </h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
              {result.replicable_rules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
