import { describe, expect, it } from "vitest";
import { allowedOrigins, isCrossOrigin, selfOrigin } from "./origins";

const env = (over: Record<string, string | undefined>) =>
  over as unknown as NodeJS.ProcessEnv;

const headers = (h: Record<string, string>) => ({
  get: (name: string) => h[name.toLowerCase()] ?? null,
});

describe("allowedOrigins", () => {
  it("always allows local development", () => {
    expect(allowedOrigins(env({}))).toContain("http://localhost:3000");
  });

  it("allows the configured app url", () => {
    expect(allowedOrigins(env({ NEXT_PUBLIC_APP_URL: "https://app.example" }))).toContain(
      "https://app.example",
    );
  });

  it("trims a trailing slash so the comparison matches an Origin header", () => {
    expect(allowedOrigins(env({ NEXT_PUBLIC_APP_URL: "https://app.example/" }))).toContain(
      "https://app.example",
    );
  });

  it("adds the scheme to VERCEL_URL, which ships without one", () => {
    expect(allowedOrigins(env({ VERCEL_URL: "viraling.vercel.app" }))).toContain(
      "https://viraling.vercel.app",
    );
  });

  it("does not duplicate an origin named by two variables", () => {
    const origins = allowedOrigins(
      env({ NEXT_PUBLIC_APP_URL: "https://a.example", URL: "https://a.example" }),
    );
    expect(origins.filter((o) => o === "https://a.example")).toHaveLength(1);
  });

  it("ignores empty values", () => {
    expect(allowedOrigins(env({ NEXT_PUBLIC_APP_URL: "   " }))).toEqual([
      "http://localhost:3000",
    ]);
  });
});

describe("selfOrigin", () => {
  it("prefers the forwarded host, which is what the browser used", () => {
    expect(
      selfOrigin(
        headers({
          "x-forwarded-host": "viraling.netlify.app",
          "x-forwarded-proto": "https",
          host: "internal-3.local",
        }),
      ),
    ).toBe("https://viraling.netlify.app");
  });

  it("falls back to the host header", () => {
    expect(selfOrigin(headers({ host: "viraling.netlify.app" }))).toBe(
      "https://viraling.netlify.app",
    );
  });

  it("takes the first entry when proxies chain the header", () => {
    expect(
      selfOrigin(
        headers({
          "x-forwarded-host": "viraling.netlify.app, internal.local",
          "x-forwarded-proto": "https, http",
        }),
      ),
    ).toBe("https://viraling.netlify.app");
  });

  it("keeps http for local development", () => {
    expect(
      selfOrigin(headers({ host: "localhost:3000", "x-forwarded-proto": "http" })),
    ).toBe("http://localhost:3000");
  });

  it("returns null with no host to trust", () => {
    expect(selfOrigin(headers({}))).toBeNull();
  });
});

describe("isCrossOrigin", () => {
  it("allows a request with no Origin header", () => {
    expect(isCrossOrigin(null, "https://a.example", env({}))).toBe(false);
  });

  it("allows the site's own host with no env configured at all", () => {
    expect(isCrossOrigin("https://a.example", "https://a.example", env({}))).toBe(false);
  });

  it("blocks a foreign origin", () => {
    expect(isCrossOrigin("https://evil.example", "https://a.example", env({}))).toBe(true);
  });

  it("blocks a lookalike hostname", () => {
    expect(isCrossOrigin("https://a.example.evil.com", "https://a.example", env({}))).toBe(
      true,
    );
  });

  it("blocks a scheme downgrade", () => {
    expect(isCrossOrigin("http://a.example", "https://a.example", env({}))).toBe(true);
  });

  it("still honours the env allowlist when the host differs", () => {
    expect(
      isCrossOrigin(
        "https://app.example",
        "https://internal.local",
        env({ NEXT_PUBLIC_APP_URL: "https://app.example" }),
      ),
    ).toBe(false);
  });
});
