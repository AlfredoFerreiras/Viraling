import { describe, expect, it } from "vitest";
import { allowedOrigins, isCrossOrigin } from "./origins";

const env = (over: Record<string, string | undefined>) =>
  over as unknown as NodeJS.ProcessEnv;

describe("allowedOrigins", () => {
  it("always allows local development", () => {
    expect(allowedOrigins(env({}))).toContain("http://localhost:3000");
  });

  it("allows the configured app url", () => {
    const origins = allowedOrigins(env({ NEXT_PUBLIC_APP_URL: "https://app.example" }));
    expect(origins).toContain("https://app.example");
  });

  it("trims a trailing slash so the comparison matches an Origin header", () => {
    const origins = allowedOrigins(env({ NEXT_PUBLIC_APP_URL: "https://app.example/" }));
    expect(origins).toContain("https://app.example");
  });

  it("trusts the host's own url, so a missing app url is not fatal", () => {
    const origins = allowedOrigins(env({ URL: "https://viraling.netlify.app" }));
    expect(origins).toContain("https://viraling.netlify.app");
  });

  it("allows preview deploys, which get a new hostname each build", () => {
    const origins = allowedOrigins(
      env({ DEPLOY_PRIME_URL: "https://deploy-preview-3--viraling.netlify.app" }),
    );
    expect(origins).toContain("https://deploy-preview-3--viraling.netlify.app");
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

describe("isCrossOrigin", () => {
  it("allows a request with no Origin header", () => {
    expect(isCrossOrigin(null, env({}))).toBe(false);
  });

  it("allows the site's own origin", () => {
    expect(isCrossOrigin("https://a.example", env({ URL: "https://a.example" }))).toBe(
      false,
    );
  });

  it("blocks a foreign origin", () => {
    expect(isCrossOrigin("https://evil.example", env({ URL: "https://a.example" }))).toBe(
      true,
    );
  });

  it("blocks a lookalike hostname", () => {
    expect(
      isCrossOrigin("https://a.example.evil.com", env({ URL: "https://a.example" })),
    ).toBe(true);
  });
});
