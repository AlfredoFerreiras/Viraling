import { describe, expect, it } from "vitest";
import {
  carouselOutput,
  extractFormatInput,
  generateScriptInput,
  reelOutput,
  skeletonOutput,
  storyOutput,
} from "./ai";

const UUID = "0f1e2d3c-4b5a-4f7e-8d9c-0a1b2c3d4e5f";

const base = {
  title: "Script",
  caption: "Caption",
  hashtags: ["#a", "#b", "#c"],
};

const cover = { white_text: "How to go from", yellow_text: "0 a 10k" };
const threeCovers = [cover, cover, cover];

function reelSections() {
  return ["hook", "context", "problem", "solution", "cta"].map((section, i) => ({
    section,
    time_start: i * 6,
    time_end: i * 6 + 6,
    spoken: "text",
    on_screen: ["text"],
  }));
}

describe("generateScriptInput", () => {
  it("accepts valid uuids and content types", () => {
    const r = generateScriptInput.safeParse({
      formatId: UUID,
      nicheId: UUID,
      contentType: "reel",
    });
    expect(r.success).toBe(true);
  });

  it("rejects free-form ids (section 7.2: uuids validated as uuids)", () => {
    const r = generateScriptInput.safeParse({
      formatId: "1 or 1=1",
      nicheId: UUID,
      contentType: "reel",
    });
    expect(r.success).toBe(false);
  });

  it("rejects unknown content types", () => {
    const r = generateScriptInput.safeParse({
      formatId: UUID,
      nicheId: UUID,
      contentType: "podcast",
    });
    expect(r.success).toBe(false);
  });
});

describe("extractFormatInput", () => {
  it("requires a transcript of at least 50 chars and caps it at 15000", () => {
    expect(extractFormatInput.safeParse({ transcript: "corto" }).success).toBe(false);
    expect(extractFormatInput.safeParse({ transcript: "x".repeat(50) }).success).toBe(true);
    expect(extractFormatInput.safeParse({ transcript: "x".repeat(15001) }).success).toBe(
      false,
    );
  });

  it("defaults contentType to reel", () => {
    const r = extractFormatInput.parse({ transcript: "x".repeat(60) });
    expect(r.contentType).toBe("reel");
  });
});

describe("skeletonOutput", () => {
  const valid = {
    name: "Tier List",
    structure: [
      { section: "hook", purpose: "p", relative_duration: "10%" },
      { section: "cta", purpose: "p", relative_duration: "10%" },
    ],
    hook_type: "pregunta",
    pacing: "fast",
    visual_elements: ["text"],
    cta_type: "comentario",
    replicable_rules: ["regla"],
  };

  it("accepts a well-formed skeleton", () => {
    expect(skeletonOutput.safeParse(valid).success).toBe(true);
  });

  it("requires at least one replicable rule and two sections", () => {
    expect(skeletonOutput.safeParse({ ...valid, replicable_rules: [] }).success).toBe(false);
    expect(
      skeletonOutput.safeParse({ ...valid, structure: valid.structure.slice(0, 1) }).success,
    ).toBe(false);
  });
});

describe("script outputs by type", () => {
  it("reel needs exactly 5 ordered sections and 3 covers", () => {
    expect(
      reelOutput.safeParse({ ...base, sections: reelSections(), covers: threeCovers }).success,
    ).toBe(true);
    expect(
      reelOutput.safeParse({
        ...base,
        sections: reelSections().slice(0, 4),
        covers: threeCovers,
      }).success,
    ).toBe(false);
    expect(
      reelOutput.safeParse({ ...base, sections: reelSections(), covers: [cover, cover] })
        .success,
    ).toBe(false);
  });

  it("carousel needs 7 to 11 slides", () => {
    const slides = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        slide: i + 1,
        title: "t",
        body: "b",
        is_cta: i === n - 1,
      }));
    expect(
      carouselOutput.safeParse({ ...base, sections: slides(7), covers: threeCovers }).success,
    ).toBe(true);
    expect(
      carouselOutput.safeParse({ ...base, sections: slides(6), covers: threeCovers }).success,
    ).toBe(false);
  });

  it("story needs 3 to 5 stories with a known purpose and allows null covers", () => {
    const stories = (n: number, purpose = "connection") =>
      Array.from({ length: n }, (_, i) => ({
        story: i + 1,
        purpose,
        spoken: "s",
        on_screen: ["o"],
      }));
    expect(storyOutput.safeParse({ ...base, sections: stories(3), covers: null }).success).toBe(
      true,
    );
    expect(storyOutput.safeParse({ ...base, sections: stories(2), covers: null }).success).toBe(
      false,
    );
    expect(
      storyOutput.safeParse({ ...base, sections: stories(3, "venta"), covers: null }).success,
    ).toBe(false);
  });

  it("caps hashtags at 30 and requires at least 3", () => {
    const many = Array.from({ length: 31 }, (_, i) => `#t${i}`);
    expect(
      reelOutput.safeParse({
        ...base,
        hashtags: many,
        sections: reelSections(),
        covers: threeCovers,
      }).success,
    ).toBe(false);
    expect(
      reelOutput.safeParse({
        ...base,
        hashtags: ["#a"],
        sections: reelSections(),
        covers: threeCovers,
      }).success,
    ).toBe(false);
  });
});
