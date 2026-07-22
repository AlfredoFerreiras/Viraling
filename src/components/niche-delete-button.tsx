"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NicheDeleteButton({
  nicheId,
  label,
  confirmText,
}: {
  nicheId: string;
  label: string;
  confirmText: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    await fetch(`/api/niches/${nicheId}`, { method: "DELETE" });
    router.refresh();
    setBusy(false);
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="cursor-pointer text-red-400 hover:underline disabled:opacity-50"
    >
      {label}
    </button>
  );
}
