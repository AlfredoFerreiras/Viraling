/**
 * The CORS / CSRF allowlist for API routes.
 *
 * The rule that actually matters is the first one: a request is same-origin
 * when its Origin header equals the host the browser used to reach us. That
 * needs no configuration, which is the point. Every env driven version of
 * this check has failed in a different way:
 *
 *   - NEXT_PUBLIC_APP_URL is inlined by Next at build time, so setting it in
 *     a host dashboard does nothing until the next build.
 *   - Netlify's URL and DEPLOY_PRIME_URL exist during the build but are not
 *     exposed to the Next server functions at runtime.
 *
 * Both failures look identical from outside: pages render, every POST 403s.
 *
 * Comparing Origin to the request's own host is also the correct CSRF check.
 * A cross-site page cannot make the victim's browser lie about Origin, and
 * the host is whatever domain the victim actually visited, so a forged
 * cross-site POST always mismatches.
 *
 * The env vars are still honoured, for origins that are legitimately not the
 * request host, such as a separate front end during local development.
 */
export function allowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const origins = new Set<string>(["http://localhost:3000"]);

  const add = (value: string | undefined, scheme?: string) => {
    if (!value) return;
    const trimmed = value.trim().replace(/\/$/, "");
    if (!trimmed) return;
    origins.add(scheme ? `${scheme}://${trimmed}` : trimmed);
  };

  add(env.NEXT_PUBLIC_APP_URL);
  add(env.URL);
  add(env.DEPLOY_PRIME_URL);
  if (env.VERCEL_URL) add(env.VERCEL_URL, "https");

  return [...origins];
}

/**
 * The origin the browser actually used, rebuilt from the forwarding headers
 * the platform sets. Returns null when there is no host header to trust.
 */
export function selfOrigin(headers: {
  get(name: string): string | null;
}): string | null {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return null;
  // x-forwarded-* can carry a list when several proxies are chained.
  const firstHost = host.split(",")[0]!.trim();
  if (!firstHost) return null;
  const proto = (headers.get("x-forwarded-proto") ?? "https").split(",")[0]!.trim();
  return `${proto}://${firstHost}`;
}

/** True when an Origin header is present and is neither our own host nor allowlisted. */
export function isCrossOrigin(
  origin: string | null,
  self: string | null = null,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!origin) return false;
  const normalised = origin.replace(/\/$/, "");
  if (self && normalised === self.replace(/\/$/, "")) return false;
  return !allowedOrigins(env).includes(normalised);
}
