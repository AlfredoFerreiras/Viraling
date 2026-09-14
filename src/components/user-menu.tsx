"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "./i18n-provider";

export function UserMenu({ email }: { email: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden max-w-40 truncate text-xs text-zinc-400 sm:inline"
        title={email}
      >
        {email}
      </span>
      <button
        onClick={signOut}
        disabled={busy}
        className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-white/10 disabled:opacity-50"
      >
        {t("auth.signOut")}
      </button>
    </div>
  );
}
