"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <div className="text-5xl">😵</div>
      <h1 className="text-2xl font-bold tracking-tight">{t("error.title")}</h1>
      <p className="max-w-md text-sm text-zinc-400">{t("error.desc")}</p>
      <div className="mt-2 flex gap-3">
        <Button onClick={reset}>↻ {t("error.retry")}</Button>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
        >
          {t("error.home")}
        </Link>
      </div>
    </main>
  );
}
