"use client";

import { createContext, useContext } from "react";
import type { Dict, DictKey } from "@/lib/i18n/dictionaries";

const I18nContext = createContext<Dict | null>(null);

export function I18nProvider({
  dict,
  children,
}: {
  dict: Dict;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={dict}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const dict = useContext(I18nContext);
  if (!dict) throw new Error("useI18n must be used inside I18nProvider");
  const t = (key: DictKey) => dict[key] ?? key;
  return { t };
}
