import { z } from "zod";

export const brandVoiceSchema = z.object({
  sells: z.string().max(1000),                 // 1. ¿Qué vendes u ofreces?
  ideal_client: z.string().max(1000),          // 2. Cliente ideal e idioma
  transformation: z.string().max(1000),        // 3. Antes / después
  tone: z.string().max(500),                   // 4. Cómo hablas
  never_say: z.string().max(1000),             // 5. Qué NO dirías
  cta_word: z.string().max(60),                // 6. Palabra CTA
  success_cases: z.string().max(1000),         // 7. Casos con números
  recordings_per_week: z.coerce.number().int().min(1).max(30), // 8. Capacidad
});

export const nicheInput = z.object({
  name: z.string().min(2).max(120),
  language: z.enum(["es", "en"]).default("es"),
  audience: z.string().max(1000).optional(),
  offer: z.string().max(1000).optional(),
  brandVoice: brandVoiceSchema,
});

export const nicheUpdateInput = nicheInput.partial();

export type BrandVoice = z.infer<typeof brandVoiceSchema>;
