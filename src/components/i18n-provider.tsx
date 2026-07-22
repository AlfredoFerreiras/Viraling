"use client";

import { createContext, useContext } from "react";
import type { Dict, DictKey, Lang } from "@/lib/i18n/dictionaries";

const I18nContext = createContext<{ lang: Lang; dict: Dict } | null>(null);

export function I18nProvider({
  lang,
  dict,
  children,
}: {
  lang: Lang;
  dict: Dict;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ lang, dict }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n debe usarse dentro de I18nProvider");
  const t = (key: DictKey) => ctx.dict[key] ?? key;
  return { t, lang: ctx.lang };
}
