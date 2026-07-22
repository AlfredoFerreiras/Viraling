"use client";

import { useState } from "react";
import { Card } from "@/components/ui";

export function KillSwitch({
  initialEnabled,
  labels,
}: {
  initialEnabled: boolean;
  labels: { title: string; on: string; off: string; desc: string };
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/admin/kill-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    if (res.ok) {
      const data = await res.json();
      setEnabled(data.enabled);
    }
    setBusy(false);
  }

  return (
    <Card
      className={
        enabled ? "border-emerald-400/30" : "border-red-500/40 bg-red-500/5"
      }
    >
      <p className="text-xs text-zinc-500">{labels.title}</p>
      <button
        onClick={toggle}
        disabled={busy}
        className={`mt-2 w-full cursor-pointer rounded-lg px-3 py-2 text-sm font-bold transition disabled:opacity-50 ${
          enabled
            ? "bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25"
            : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
        }`}
      >
        {enabled ? `● ${labels.on}` : `○ ${labels.off}`}
      </button>
      <p className="mt-2 text-[11px] leading-snug text-zinc-500">{labels.desc}</p>
    </Card>
  );
}
