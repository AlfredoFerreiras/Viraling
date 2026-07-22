import { cookies } from "next/headers";
import { getDict, normalizeLang, type Dict, type Lang } from "./dictionaries";

export const LANG_COOKIE = "fb_lang";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return normalizeLang(store.get(LANG_COOKIE)?.value);
}

export async function getServerDict(): Promise<{ lang: Lang; dict: Dict }> {
  const lang = await getLang();
  return { lang, dict: getDict(lang) };
}
