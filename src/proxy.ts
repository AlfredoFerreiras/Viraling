import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

// Público: landing, sign-in, sign-up, webhooks y crons (estos dos
// verifican su propia firma/secret). Todo lo demás exige sesión.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
]);

const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);

function allowedOrigins(): string[] {
  const origins = ["http://localhost:3000"];
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""));
  }
  return origins;
}

/**
 * CORS (sección 7.1): las API routes solo aceptan requests del propio
 * origin. Si viene un header Origin y no está en la lista, 403 antes de
 * cualquier lógica. Requests same-origin de navegación no mandan Origin
 * y pasan.
 */
function corsViolation(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return !allowedOrigins().includes(origin.replace(/\/$/, ""));
}

/**
 * Headers de seguridad (sección 7.1). La CSP permite solo lo que la app
 * usa de verdad: Clerk (scripts, workers, imágenes, websockets) y el
 * captcha de Cloudflare que Clerk usa contra bots. En dev se suma
 * 'unsafe-eval' porque el hot reload de Next lo requiere.
 */
function applySecurityHeaders(res: NextResponse): void {
  const isDev = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://img.clerk.com data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' https://*.clerk.accounts.dev https://clerk-telemetry.com${isDev ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "frame-src https://challenges.cloudflare.com",
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

export default clerkMiddleware(async (auth, request) => {
  if (isApiRoute(request) && corsViolation(request)) {
    return new NextResponse(JSON.stringify({ error: "Origin no permitido" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const res = NextResponse.next();
  applySecurityHeaders(res);
  return res;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
