import { z } from "zod";
import { contentTypeSchema, uuidSchema } from "./index";

// ---------- Inputs de los endpoints ----------

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

// ---------- Salidas de Claude (sección 9 de CLAUDE.md) ----------

// 9.1 Extractor: skeleton del formato
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

// 9.2 Generador: la salida cambia según contentType (sección 8.3)

const coverSchema = z.object({
  white_text: z.string(),
  yellow_text: z.string(), // amarillo solo en palabras de resultado
});

const scriptBase = z.object({
  title: z.string().min(1).max(200),
  caption: z.string().min(1).max(2200),
  hashtags: z.array(z.string()).min(3).max(30),
});

// Reel: 5 secciones con tiempos + textos en pantalla + 3 portadas
export const reelOutput = scriptBase.extend({
  sections: z
    .array(
      z.object({
        section: z.enum(["hook", "contexto", "problema", "solucion", "cta"]),
        time_start: z.number().min(0),
        time_end: z.number().min(0),
        spoken: z.string(),
        on_screen: z.array(z.string()),
      }),
    )
    .length(5),
  covers: z.array(coverSchema).length(3),
});

// Carrusel: 7 a 10 slides + slide final de CTA (viene incluido en el array)
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

// Story: secuencia de 3 a 5 stories con propósito por story
export const storyOutput = scriptBase.extend({
  sections: z
    .array(
      z.object({
        story: z.number().int().min(1),
        purpose: z.enum(["conexion", "prueba", "producto", "cta"]),
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
