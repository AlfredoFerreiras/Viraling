import { describe, expect, it } from "vitest";
import { signInInput, signUpInput } from "./auth";

describe("signUpInput", () => {
  it("normalizes the email to lowercase and trims it", () => {
    const r = signUpInput.parse({ email: "  Demo@Example.COM ", password: "12345678" });
    expect(r.email).toBe("demo@example.com");
  });

  it("requires a valid email", () => {
    expect(signUpInput.safeParse({ email: "nope", password: "12345678" }).success).toBe(false);
  });

  it("requires a password between 8 and 128 chars", () => {
    expect(signUpInput.safeParse({ email: "a@b.co", password: "1234567" }).success).toBe(false);
    expect(signUpInput.safeParse({ email: "a@b.co", password: "x".repeat(129) }).success).toBe(
      false,
    );
    expect(signUpInput.safeParse({ email: "a@b.co", password: "x".repeat(8) }).success).toBe(
      true,
    );
  });
});

describe("signInInput", () => {
  it("accepts any non-empty password (the check happens against the hash)", () => {
    expect(signInInput.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(signInInput.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
