/**
 * Shared demo account.
 *
 * The app is a portfolio piece, so a visitor gets a one click way in rather
 * than a credentials prompt. Everything about the demo lives behind this one
 * env var: unset it and the demo route 404s and the buttons disappear.
 */
export const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "";

export function isDemoEnabled(): boolean {
  return DEMO_EMAIL.length > 0;
}
