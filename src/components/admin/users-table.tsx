"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Badge, Button, Card, Input, Spinner } from "@/components/ui";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  plan: string;
  tokensBalance: number;
  createdAt: string | null;
};

export function AdminUsersTable() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [amount, setAmount] = useState(5);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
    if (res.ok) setRows((await res.json()).users);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(q), 300);
    return () => clearTimeout(timer);
  }, [q, load]);

  async function adjust(sign: 1 | -1) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${selected.id}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: sign * Math.abs(amount), reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.error"));
        return;
      }
      setSelected(null);
      setReason("");
      await load(q);
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("admin.search")}
      />

      {rows === null ? (
        <div className="flex items-center gap-2 py-6 text-sm text-zinc-500">
          <Spinner /> {t("common.loading")}
        </div>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">{t("dash.plan")}</th>
                <th className="px-4 py-3">{t("dash.role")}</th>
                <th className="px-4 py-3 text-right">{t("dash.tokens")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-white/3">
                  <td className="px-4 py-2.5">{u.email}</td>
                  <td className="px-4 py-2.5 capitalize">{u.plan}</td>
                  <td className="px-4 py-2.5">
                    <Badge color={u.role === "admin" ? "amber" : "zinc"}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-amber-300">
                    {u.tokensBalance}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => setSelected(u)}
                      className="cursor-pointer text-xs text-amber-300 hover:underline"
                    >
                      {t("admin.grant")} / {t("admin.revoke")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {selected && (
        <Card className="space-y-3 border-amber-400/30">
          <p className="text-sm font-semibold">{selected.email}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">
                {t("admin.amount")}
              </label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">
                {t("admin.reason")}
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                minLength={3}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSelected(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => adjust(-1)}
              disabled={busy || reason.trim().length < 3}
            >
              − {t("admin.revoke")}
            </Button>
            <Button
              onClick={() => adjust(1)}
              disabled={busy || reason.trim().length < 3}
            >
              {busy && <Spinner />}+ {t("admin.grant")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
