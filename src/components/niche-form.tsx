"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "./i18n-provider";
import { Button, Card, Input, Label, Select, Spinner, Textarea } from "./ui";

export type NicheFormValues = {
  name: string;
  language: "es" | "en";
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
  language: "es",
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

/**
 * mode "wizard": onboarding paso a paso (8 preguntas de la sección 8.1).
 * mode "full": formulario completo para editar.
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

  const bv = values.brandVoice;
  const setBv = (patch: Partial<NicheFormValues["brandVoice"]>) =>
    setValues((v) => ({ ...v, brandVoice: { ...v.brandVoice, ...patch } }));

  // Paso 0 = nombre + idioma; pasos 1..8 = las 8 preguntas
  const steps: { label: string; field: React.ReactNode; valid: boolean }[] = [
    {
      label: t("onb.name"),
      valid: values.name.trim().length >= 2,
      field: (
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
          <div>
            <Label>{t("onb.lang")}</Label>
            <Select
              value={values.language}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  language: e.target.value as "es" | "en",
                }))
              }
            >
              <option value="es">{t("onb.langEs")}</option>
              <option value="en">{t("onb.langEn")}</option>
            </Select>
          </div>
        </div>
      ),
    },
    {
      label: t("onb.q1"),
      valid: bv.sells.trim().length > 0,
      field: (
        <Textarea
          value={bv.sells}
          onChange={(e) => setBv({ sells: e.target.value })}
          autoFocus
        />
      ),
    },
    {
      label: t("onb.q2"),
      valid: bv.ideal_client.trim().length > 0,
      field: (
        <Textarea
          value={bv.ideal_client}
          onChange={(e) => setBv({ ideal_client: e.target.value })}
        />
      ),
    },
    {
      label: t("onb.q3"),
      valid: bv.transformation.trim().length > 0,
      field: (
        <Textarea
          value={bv.transformation}
          onChange={(e) => setBv({ transformation: e.target.value })}
        />
      ),
    },
    {
      label: t("onb.q4"),
      valid: bv.tone.trim().length > 0,
      field: (
        <Input value={bv.tone} onChange={(e) => setBv({ tone: e.target.value })} />
      ),
    },
    {
      label: t("onb.q5"),
      valid: bv.never_say.trim().length > 0,
      field: (
        <Textarea
          value={bv.never_say}
          onChange={(e) => setBv({ never_say: e.target.value })}
        />
      ),
    },
    {
      label: t("onb.q6"),
      valid: bv.cta_word.trim().length > 0,
      field: (
        <Input
          value={bv.cta_word}
          placeholder={t("onb.q6Ph")}
          onChange={(e) => setBv({ cta_word: e.target.value })}
        />
      ),
    },
    {
      label: t("onb.q7"),
      valid: bv.success_cases.trim().length > 0,
      field: (
        <Textarea
          value={bv.success_cases}
          onChange={(e) => setBv({ success_cases: e.target.value })}
        />
      ),
    },
    {
      label: t("onb.q8"),
      valid: bv.recordings_per_week >= 1,
      field: (
        <Input
          type="number"
          min={1}
          max={30}
          value={bv.recordings_per_week}
          onChange={(e) =>
            setBv({ recordings_per_week: Number(e.target.value) || 1 })
          }
        />
      ),
    },
  ];

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(nicheId ? `/api/niches/${nicheId}` : "/api/niches", {
        method: nicheId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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

  if (mode === "full") {
    return (
      <Card className="space-y-5">
        {steps.map((s, i) => (
          <div key={i}>
            <Label>{s.label}</Label>
            {s.field}
          </div>
        ))}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => router.back()}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={saving || steps.some((s) => !s.valid)}>
            {saving && <Spinner />}
            {saving ? t("onb.saving") : t("common.save")}
          </Button>
        </div>
      </Card>
    );
  }

  const current = steps[step];
  const isLast = step === steps.length - 1;

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
        <h2 className="mb-3 text-lg font-semibold">{current.label}</h2>
        {current.field}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || saving}
        >
          ← {t("onb.back")}
        </Button>
        {isLast ? (
          <Button onClick={submit} disabled={saving || steps.some((s) => !s.valid)}>
            {saving && <Spinner />}
            {saving ? t("onb.saving") : t("onb.save")}
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!current.valid}>
            {t("onb.next")} →
          </Button>
        )}
      </div>
    </Card>
  );
}
