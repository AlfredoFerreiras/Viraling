import { z } from "zod";
import { contentTypeSchema, uuidSchema } from "./index";

// ---------- Endpoint inputs ----------

export const extractFormatInput = z.object({
  transcript: z.string().min(50).max(15000),
  visualDescription: z.string().max(3000).optional(),
  name: z.string().min(1).max(120).optional(),
  contentType: contentTypeSchema.default("reel"),
  nicheId: uuidSchema.optional(),
});

export const generateScriptInput = z.object({
  formatId: uuidSchema,
  nicheId: uuidSchema,
  contentType: contentTypeSchema,
});

// ---------- Claude outputs (section 9 of CLAUDE.md) ----------

// 9.1 Extractor: the format skeleton
export const skeletonOutput = z.object({
  name: z.string().min(1).max(120),
  structure: z
    .array(
      z.object({
        section: z.string(),
        purpose: z.string(),
        relative_duration: z.string(),
      }),
    )
    .min(2)
    .max(12),
  hook_type: z.string(),
  pacing: z.string(),
  visual_elements: z.array(z.string()),
  cta_type: z.string(),
  replicable_rules: z.array(z.string()).min(1),
});
export type SkeletonOutput = z.infer<typeof skeletonOutput>;

// 9.2 Generator: the output changes with contentType (section 8.3)

const coverSchema = z.object({
  white_text: z.string(),
  yellow_text: z.string(), // amarillo solo en palabras de resultado
});

const scriptBase = z.object({
  title: z.string().min(1).max(200),
  caption: z.string().min(1).max(2200),
  hashtags: z.array(z.string()).min(3).max(30),
});

// Reel: 5 sections with times + on screen text + 3 covers
export const reelOutput = scriptBase.extend({
  sections: z
    .array(
      z.object({
        section: z.enum(["hook", "context", "problem", "solution", "cta"]),
        time_start: z.number().min(0),
        time_end: z.number().min(0),
        spoken: z.string(),
        on_screen: z.array(z.string()),
      }),
    )
    .length(5),
  covers: z.array(coverSchema).length(3),
});

// Carousel: 7 to 10 slides + final CTA slide (included in the array)
export const carouselOutput = scriptBase.extend({
  sections: z
    .array(
      z.object({
        slide: z.number().int().min(1),
        title: z.string(),
        body: z.string(),
        is_cta: z.boolean(),
      }),
    )
    .min(7)
    .max(11),
  covers: z.array(coverSchema).length(3),
});

// Story: sequence of 3 to 5 stories with a purpose per story
export const storyOutput = scriptBase.extend({
  sections: z
    .array(
      z.object({
        story: z.number().int().min(1),
        purpose: z.enum(["connection", "proof", "product", "cta"]),
        spoken: z.string(),
        on_screen: z.array(z.string()),
      }),
    )
    .min(3)
    .max(5),
  covers: z.null().or(z.array(coverSchema).max(3)).optional(),
});

export const scriptOutputByType = {
  reel: reelOutput,
  carousel: carouselOutput,
  story: storyOutput,
} as const;

export type ScriptOutput =
  | z.infer<typeof reelOutput>
  | z.infer<typeof carouselOutput>
  | z.infer<typeof storyOutput>;
