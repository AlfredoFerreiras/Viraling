"use client";

import { useState } from "react";
import { useI18n } from "./i18n-provider";

export function CopyButton({ text }: { text: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="cursor-pointer rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white"
    >
      {copied ? `✓ ${t("script.copied")}` : `⧉ ${t("script.copy")}`}
    </button>
  );
}
