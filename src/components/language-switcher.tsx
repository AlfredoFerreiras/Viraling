"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useI18n } from "./i18n-provider";

const LANG_COOKIE = "fb_lang";
const ONE_YEAR = 60 * 60 * 24 * 365;

function writeLangCookie(lang: "es" | "en"): void {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function LanguageSwitcher() {
  const { lang } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLang(next: "es" | "en") {
    writeLangCookie(next);
    startTransition(() => router.refresh());
  }

  return (
    <div
      className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 text-xs font-medium"
      role="group"
      aria-label="Language"
    >
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          disabled={pending}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
            lang === l
              ? "bg-amber-400 text-zinc-950"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
