import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/token";

/**
 * Proxy (middleware) de la app:
 *  1. CORS: las API routes solo aceptan requests del propio origin.
 *  2. Auth barata: sin cookie de sesión, las páginas privadas redirigen a
 *     /sign-in y las API responden 401. La validación real de la sesión
 *     (existe en DB, no venció) la hace getCurrentUser en cada página y
 *     handler, así que una cookie inventada no pasa de ahí.
 *  3. Headers de seguridad en toda respuesta.
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

function allowedOrigins(): string[] {
  const origins = ["http://localhost:3000"];
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""));
  }
  return origins;
}

/**
 * CORS (sección 7.1): si viene un header Origin y no está en la lista,
 * 403 antes de cualquier lógica. Junto con la cookie sameSite=lax esto
 * también cubre CSRF en los POST de la API.
 */
function corsViolation(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return !allowedOrigins().includes(origin.replace(/\/$/, ""));
}

/**
 * Headers de seguridad (sección 7.1). Sin proveedores externos de auth,
 * la CSP solo permite el propio origin. En dev se suma 'unsafe-eval' y
 * websockets porque el hot reload de Next lo requiere.
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
