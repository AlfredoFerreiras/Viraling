import { describe, expect, it } from "vitest";
import { getDict, normalizeLang } from "./dictionaries";

describe("dictionaries", () => {
  it("es and en expose the same keys", () => {
    const es = Object.keys(getDict("es")).sort();
    const en = Object.keys(getDict("en")).sort();
    expect(en).toEqual(es);
  });

  it("no translation is empty", () => {
    for (const lang of ["es", "en"] as const) {
      for (const [key, value] of Object.entries(getDict(lang))) {
        expect(value.trim(), `${lang}:${key}`).not.toBe("");
      }
    }
  });

  it("normalizeLang falls back to es", () => {
    expect(normalizeLang("en")).toBe("en");
    expect(normalizeLang("es")).toBe("es");
    expect(normalizeLang("fr")).toBe("es");
    expect(normalizeLang(undefined)).toBe("es");
  });
});
