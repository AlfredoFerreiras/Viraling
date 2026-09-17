import { describe, expect, it } from "vitest";
import { brandVoiceSchema, nicheInput, nicheUpdateInput } from "./niches";

const voice = {
  sells: "Credit coaching",
  ideal_client: "First time borrowers in the US",
  transformation: "De score 500 a 700",
  tone: "cercano",
  never_say: "garantizado",
  cta_word: "CREDIT",
  success_cases: "300 clientes",
  recordings_per_week: "3",
};

describe("brandVoiceSchema", () => {
  it("coerces recordings_per_week from string to int", () => {
    const r = brandVoiceSchema.parse(voice);
    expect(r.recordings_per_week).toBe(3);
  });

  it("bounds recordings_per_week to 1..30 integers", () => {
    expect(brandVoiceSchema.safeParse({ ...voice, recordings_per_week: 0 }).success).toBe(false);
    expect(brandVoiceSchema.safeParse({ ...voice, recordings_per_week: 31 }).success).toBe(
      false,
    );
    expect(brandVoiceSchema.safeParse({ ...voice, recordings_per_week: 2.5 }).success).toBe(
      false,
    );
  });

  it("caps free-text answers", () => {
    expect(brandVoiceSchema.safeParse({ ...voice, sells: "x".repeat(1001) }).success).toBe(
      false,
    );
    expect(brandVoiceSchema.safeParse({ ...voice, cta_word: "x".repeat(61) }).success).toBe(
      false,
    );
  });
});

describe("nicheInput", () => {
  it("defaults language to en and requires a name of 2+ chars", () => {
    const r = nicheInput.parse({ name: "Credit repair", brandVoice: voice });
    expect(r.language).toBe("en");
    expect(nicheInput.safeParse({ name: "x", brandVoice: voice }).success).toBe(false);
  });

  it("only allows es or en", () => {
    expect(
      nicheInput.safeParse({ name: "Niche", language: "fr", brandVoice: voice }).success,
    ).toBe(false);
  });

  it("update input makes every field optional", () => {
    expect(nicheUpdateInput.safeParse({}).success).toBe(true);
    expect(nicheUpdateInput.safeParse({ name: "New name" }).success).toBe(true);
  });
});
