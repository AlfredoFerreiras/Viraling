/**
 * The CORS allowlist for API routes.
 *
 * NEXT_PUBLIC_APP_URL is the explicit setting, but it is a NEXT_PUBLIC_ var,
 * which Next inlines at build time. Setting it in the host's dashboard after
 * a build has already run therefore changes nothing until the next build, and
 * the failure it produces is nasty: pages render fine while every POST comes
 * back 403.
 *
 * So the host's own url variables are trusted too. They are plain runtime env
 * vars, they are set by the platform rather than by a request, and they also
 * cover deploy previews, which have a different hostname on every build.
 *   - URL              Netlify: the site's primary url
 *   - DEPLOY_PRIME_URL Netlify: this branch/preview deploy's url
 *   - VERCEL_URL       Vercel: the deployment host, without a scheme
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

/** True when an Origin header is present and is not on the allowlist. */
export function isCrossOrigin(
  origin: string | null,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!origin) return false;
  return !allowedOrigins(env).includes(origin.replace(/\/$/, ""));
}
