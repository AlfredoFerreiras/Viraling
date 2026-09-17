import { z } from "zod";

export const brandVoiceSchema = z.object({
  sells: z.string().max(1000),                 // 1. What do you sell or offer?
  ideal_client: z.string().max(1000),          // 2. Ideal client
  transformation: z.string().max(1000),        // 3. Before / after
  tone: z.string().max(500),                   // 4. How you speak
  never_say: z.string().max(1000),             // 5. What you would NOT say
  cta_word: z.string().max(60),                // 6. CTA word
  success_cases: z.string().max(1000),         // 7. Cases with numbers
  recordings_per_week: z.coerce.number().int().min(1).max(30), // 8. Capacidad
});

export const nicheInput = z.object({
  name: z.string().min(2).max(120),
  language: z.literal("en").default("en"),
  audience: z.string().max(1000).optional(),
  offer: z.string().max(1000).optional(),
  brandVoice: brandVoiceSchema,
});

export const nicheUpdateInput = nicheInput.partial();

export type BrandVoice = z.infer<typeof brandVoiceSchema>;
