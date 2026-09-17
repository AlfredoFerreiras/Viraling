"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { useI18n } from "./i18n-provider";
import { Button, Card, Input, Label, Spinner, Textarea, cx } from "./ui";

export type NicheFormValues = {
  name: string;
  language: "en";
  brandVoice: {
    sells: string;
    ideal_client: string;
    transformation: string;
    tone: string;
    never_say: string;
    cta_word: string;
    success_cases: string;
    recordings_per_week: number;
  };
};

const EMPTY: NicheFormValues = {
  name: "",
  language: "en",
  brandVoice: {
    sells: "",
    ideal_client: "",
    transformation: "",
    tone: "",
    never_say: "",
    cta_word: "",
    success_cases: "",
    recordings_per_week: 3,
  },
};

const SELL_OPTIONS: DictKey[] = [
  "onb.sell.services",
  "onb.sell.coaching",
  "onb.sell.digital",
  "onb.sell.physical",
  "onb.sell.local",
  "onb.sell.content",
];

const AUD_OPTIONS: DictKey[] = [
  "onb.aud.entrepreneurs",
  "onb.aud.creators",
  "onb.aud.professionals",
  "onb.aud.families",
  "onb.aud.latinos",
  "onb.aud.youth",
];

const TONE_OPTIONS: DictKey[] = [
  "onb.tone.cercano",
  "onb.tone.formal",
  "onb.tone.callejero",
  "onb.tone.tecnico",
  "onb.tone.motivacional",
];

const FREQ_OPTIONS: { key: DictKey; value: number }[] = [
  { key: "onb.freq.low", value: 2 },
  { key: "onb.freq.mid", value: 4 },
  { key: "onb.freq.high", value: 6 },
  { key: "onb.freq.daily", value: 10 },
];

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "cursor-pointer rounded-full border px-4 py-2 text-sm transition",
        selected
          ? "border-amber-400/70 bg-amber-400/15 font-semibold text-amber-300"
          : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

/**
 * mode "wizard": onboarding with chip selections (the 8 questions from
 * section 8.1; only name, tone and CTA word are required).
 * mode "full": complete form to edit the saved text.
 */
export function NicheForm({
  mode,
  nicheId,
  initial,
}: {
  mode: "wizard" | "full";
  nicheId?: string;
  initial?: NicheFormValues;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [values, setValues] = useState<NicheFormValues>(initial ?? EMPTY);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard selection state
  const [sellChoice, setSellChoice] = useState<string>("");
  const [sellDetail, setSellDetail] = useState("");
  const [audChoices, setAudChoices] = useState<string[]>([]);
  const [audDetail, setAudDetail] = useState("");
  const [toneChoice, setToneChoice] = useState<string>("");
  const [freqValue, setFreqValue] = useState<number>(4);

  const bv = values.brandVoice;
  const setBv = (patch: Partial<NicheFormValues["brandVoice"]>) =>
    setValues((v) => ({ ...v, brandVoice: { ...v.brandVoice, ...patch } }));

  async function submit(finalValues: NicheFormValues) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(nicheId ? `/api/niches/${nicheId}` : "/api/niches", {
        method: nicheId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalValues),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.error"));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  // ---------- Edit mode: complete form ----------
  if (mode === "full") {
    const fields: { label: string; key: keyof NicheFormValues["brandVoice"] }[] = [
      { label: t("onb.q1"), key: "sells" },
      { label: t("onb.q2"), key: "ideal_client" },
      { label: t("onb.q3"), key: "transformation" },
      { label: t("onb.q4"), key: "tone" },
      { label: t("onb.q5"), key: "never_say" },
      { label: t("onb.q7"), key: "success_cases" },
    ];
    return (
      <Card className="space-y-5">
        <div>
          <Label>{t("onb.name")}</Label>
          <Input
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          />
        </div>
        {fields.map((f) => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <Textarea
              value={bv[f.key] as string}
              onChange={(e) => setBv({ [f.key]: e.target.value })}
              className="min-h-16"
            />
          </div>
        ))}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t("onb.q6")}</Label>
            <Input
              value={bv.cta_word}
              onChange={(e) => setBv({ cta_word: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("onb.q8")}</Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={bv.recordings_per_week}
              onChange={(e) =>
                setBv({ recordings_per_week: Number(e.target.value) || 1 })
              }
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => router.back()}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => submit(values)}
            disabled={saving || values.name.trim().length < 2}
          >
            {saving && <Spinner />}
            {saving ? t("onb.saving") : t("common.save")}
          </Button>
        </div>
      </Card>
    );
  }

  // ---------- Modo wizard: selecciones ----------
  type Step = {
    title: string;
    optional?: boolean;
    canNext: boolean;
    body: React.ReactNode;
  };

  const steps: Step[] = [
    // 0. Name
    {
      title: t("onb.name"),
      canNext: values.name.trim().length >= 2,
      body: (
        <div className="space-y-4">
          <div>
            <Label>{t("onb.name")}</Label>
            <Input
              value={values.name}
              placeholder={t("onb.namePh")}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              autoFocus
            />
          </div>
        </div>
      ),
    },
    // 1. What you sell (selection + optional detail)
    {
      title: t("onb.q1"),
      canNext: sellChoice !== "",
      body: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {SELL_OPTIONS.map((key) => (
              <Chip
                key={key}
                selected={sellChoice === t(key)}
                onClick={() => setSellChoice(t(key))}
              >
                {t(key)}
              </Chip>
            ))}
          </div>
          <div>
            <Label>{t("onb.detail")}</Label>
            <Input
              value={sellDetail}
              onChange={(e) => setSellDetail(e.target.value)}
              placeholder="e.g. credit repair, cards, funding"
            />
          </div>
        </div>
      ),
    },
    // 2 · Audiencia (multi, opcional)
    {
      title: t("onb.q2"),
      optional: true,
      canNext: true,
      body: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {AUD_OPTIONS.map((key) => {
              const label = t(key);
              const selected = audChoices.includes(label);
              return (
                <Chip
                  key={key}
                  selected={selected}
                  onClick={() =>
                    setAudChoices((prev) =>
                      selected
                        ? prev.filter((a) => a !== label)
                        : [...prev, label],
                    )
                  }
                >
                  {label}
                </Chip>
              );
            })}
          </div>
          <div>
            <Label>{t("onb.detail")}</Label>
            <Input
              value={audDetail}
              onChange={(e) => setAudDetail(e.target.value)}
            />
          </div>
        </div>
      ),
    },
    // 3. Tone (selection) + CTA word
    {
      title: t("onb.q4"),
      canNext: toneChoice !== "" && bv.cta_word.trim().length > 0,
      body: (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((key) => (
              <Chip
                key={key}
                selected={toneChoice === t(key)}
                onClick={() => setToneChoice(t(key))}
              >
                {t(key)}
              </Chip>
            ))}
          </div>
          <div>
            <Label>{t("onb.q6")}</Label>
            <Input
              value={bv.cta_word}
              placeholder={t("onb.q6Ph")}
              onChange={(e) => setBv({ cta_word: e.target.value.toUpperCase() })}
            />
          </div>
        </div>
      ),
    },
    // 4. Optional details (transformation, cases, what not to say)
    {
      title: `${t("onb.q3").split("(")[0].trim()}`,
      optional: true,
      canNext: true,
      body: (
        <div className="space-y-4">
          <div>
            <Label>{t("onb.q3")}</Label>
            <Textarea
              value={bv.transformation}
              onChange={(e) => setBv({ transformation: e.target.value })}
              className="min-h-16"
            />
          </div>
          <div>
            <Label>{t("onb.q7")}</Label>
            <Textarea
              value={bv.success_cases}
              onChange={(e) => setBv({ success_cases: e.target.value })}
              className="min-h-16"
              placeholder="Ej. +200 clientes, scores subidos 150 puntos"
            />
          </div>
          <div>
            <Label>{t("onb.q5")}</Label>
            <Input
              value={bv.never_say}
              onChange={(e) => setBv({ never_say: e.target.value })}
            />
          </div>
        </div>
      ),
    },
    // 5. Frequency (selection)
    {
      title: t("onb.q8"),
      canNext: true,
      body: (
        <div className="flex flex-wrap gap-2">
          {FREQ_OPTIONS.map((opt) => (
            <Chip
              key={opt.key}
              selected={freqValue === opt.value}
              onClick={() => setFreqValue(opt.value)}
            >
              {t(opt.key)}
            </Chip>
          ))}
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  function buildFinalValues(): NicheFormValues {
    return {
      ...values,
      brandVoice: {
        ...bv,
        sells: [sellChoice, sellDetail.trim()].filter(Boolean).join(": "),
        ideal_client: [audChoices.join(", "), audDetail.trim()]
          .filter(Boolean)
          .join(". "),
        tone: toneChoice,
        recordings_per_week: freqValue,
      },
    };
  }

  return (
    <Card className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
          <span>
            {t("onb.step")} {step + 1} {t("onb.of")} {steps.length}
          </span>
          <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-amber-400 transition-all"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-semibold">{current.title}</h2>
          {current.optional && (
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
              {t("onb.optional")}
            </span>
          )}
        </div>
        {current.body}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || saving}
        >
          ← {t("onb.back")}
        </Button>
        <div className="flex items-center gap-3">
          {current.optional && !isLast && (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-300"
            >
              {t("onb.skip")}
            </button>
          )}
          {isLast ? (
            <Button onClick={() => submit(buildFinalValues())} disabled={saving}>
              {saving && <Spinner />}
              {saving ? t("onb.saving") : `✓ ${t("onb.save")}`}
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!current.canNext}>
              {t("onb.next")} →
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
