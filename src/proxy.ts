import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/token";
import { isCrossOrigin } from "@/lib/origins";

/**
 * App proxy (middleware):
 *  1. CORS: API routes only accept requests from our own origin.
 *  2. Cheap auth: with no session cookie, private pages redirect to
 *     /sign-in and APIs answer 401. The real session validation
 *     (exists in the DB, not expired) happens in getCurrentUser on every
 *     page and handler, so a forged cookie gets no further than this.
 *  3. Security headers on every response.
 */

const PUBLIC_PAGES = new Set(["/", "/terms", "/privacy", "/sign-in", "/sign-up"]);
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/cron/"];

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function isPublic(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) return true;
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * CORS (section 7.1): if an Origin header arrives and is not allowlisted,
 * return 403 before any logic. Together with the sameSite=lax cookie this
 * also covers CSRF on API POSTs. The allowlist lives in @/lib/origins.
 */
function corsViolation(request: NextRequest): boolean {
  return isCrossOrigin(request.headers.get("origin"));
}

/**
 * Security headers (section 7.1). With no external auth providers,
 * the CSP only allows our own origin. In dev we add unsafe-eval and
 * websockets because the Next hot reload requires them.
 */
function applySecurityHeaders(res: NextResponse): void {
  const isDev = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isApiRoute(pathname) && corsViolation(request)) {
    const res = NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
    applySecurityHeaders(res);
    return res;
  }

  if (!isPublic(pathname)) {
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    if (!hasSession) {
      if (isApiRoute(pathname)) {
        const res = NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        applySecurityHeaders(res);
        return res;
      }
      const signIn = new URL("/sign-in", request.url);
      signIn.searchParams.set("next", pathname);
      const res = NextResponse.redirect(signIn);
      applySecurityHeaders(res);
      return res;
    }
  }

  const res = NextResponse.next();
  applySecurityHeaders(res);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/api(.*)",
  ],
};
