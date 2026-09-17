"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useI18n } from "./i18n-provider";
import { Button, Card, Input, Label, Spinner } from "./ui";

/** Destination after authenticating: internal routes only, never external URLs. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "sign-up";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          res.status === 401
            ? t("auth.invalid")
            : res.status === 409
              ? t("auth.taken")
              : res.status === 429
                ? t("auth.tooMany")
                : (data.error ?? t("common.error")),
        );
        return;
      }
      router.push(isSignUp ? "/onboarding" : safeNext(params.get("next")));
      router.refresh();
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <h1 className="mb-1 text-xl font-bold tracking-tight">
        {isSignUp ? t("auth.signUpTitle") : t("auth.signInTitle")}
      </h1>
      <p className="mb-6 text-sm text-zinc-400">
        {isSignUp ? t("auth.signUpSubtitle") : t("auth.signInSubtitle")}
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            minLength={isSignUp ? 8 : 1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {isSignUp && (
            <p className="mt-1 text-xs text-zinc-500">{t("auth.passwordHint")}</p>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy && <Spinner />}
          {isSignUp ? t("auth.signUpButton") : t("auth.signInButton")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-400">
        {isSignUp ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-medium text-amber-300 hover:underline"
        >
          {isSignUp ? t("nav.signIn") : t("nav.signUp")}
        </Link>
      </p>
    </Card>
  );
}
