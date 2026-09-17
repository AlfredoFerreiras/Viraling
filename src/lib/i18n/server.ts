import { getDict, type Dict } from "./dictionaries";

/**
 * Server-side access to the UI copy. The app ships in English only, so this
 * is a thin wrapper that keeps every page reading from the same dictionary.
 */
export async function getServerDict(): Promise<{ dict: Dict }> {
  return { dict: getDict() };
}
