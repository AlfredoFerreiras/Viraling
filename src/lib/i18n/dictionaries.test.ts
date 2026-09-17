import { describe, expect, it } from "vitest";
import { getDict } from "./dictionaries";

describe("dictionaries", () => {
  it("exposes a non-empty dictionary", () => {
    expect(Object.keys(getDict()).length).toBeGreaterThan(50);
  });

  it("no string is empty", () => {
    for (const [key, value] of Object.entries(getDict())) {
      expect(value.trim(), key).not.toBe("");
    }
  });
});
