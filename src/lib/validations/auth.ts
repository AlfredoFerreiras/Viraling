import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(254));

export const signUpInput = z.object({
  email,
  password: z.string().min(8).max(128),
});

export const signInInput = z.object({
  email,
  password: z.string().min(1).max(128),
});

export type SignUpInput = z.infer<typeof signUpInput>;
export type SignInInput = z.infer<typeof signInInput>;
