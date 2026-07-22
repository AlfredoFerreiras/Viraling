"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "./i18n-provider";

export type NicheOption = { id: string; name: string };

/**
 * Selector de nicho activo, persistente vía cookie fb_niche.
 * Los server components leen la cookie para preseleccionar.
 */
export function NicheSwitcher({
  niches,
  activeId,
}: {
  niches: NicheOption[];
  activeId: string | null;
}) {
  const router = useRouter();
  const { t } = useI18n();
  if (niches.length === 0) return null;

  return (
    <select
      aria-label={t("niches.select")}
      value={activeId ?? niches[0].id}
      onChange={(e) => {
        document.cookie = `fb_niche=${e.target.value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        router.refresh();
      }}
      className="max-w-40 cursor-pointer truncate rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-200 outline-none hover:bg-white/10"
    >
      {niches.map((n) => (
        <option key={n.id} value={n.id} className="bg-zinc-900">
          {n.name}
        </option>
      ))}
    </select>
  );
}
