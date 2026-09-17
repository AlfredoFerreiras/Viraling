"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "./i18n-provider";
import { Spinner } from "./ui";

/**
 * One click entry into the demo account. Posts to /api/auth/demo, which is
 * the only thing that knows which account that is.
 */
export function DemoButton({ variant = "primary" }: { variant?: "primary" | "ghost" }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enter() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) {
        setError(res.status === 429 ? t("auth.tooMany") : t("common.error"));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3 text-base font-semibold transition disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-amber-400 text-zinc-950 shadow-[0_0_40px_-8px_rgba(251,191,36,0.6)] hover:bg-amber-300"
      : "border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20";

  return (
    <div className="w-full">
      <button onClick={enter} disabled={busy} className={`${base} ${styles}`}>
        {busy && <Spinner />}
        {t("demo.enter")}
      </button>
      <p className="mt-2 text-center text-xs text-zinc-500">{t("demo.enterHint")}</p>
      {error && <p className="mt-2 text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
