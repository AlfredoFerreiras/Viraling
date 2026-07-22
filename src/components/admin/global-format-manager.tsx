"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";

type Skeleton = {
  name: string;
  structure: { section: string; purpose: string; relative_duration: string }[];
  hook_type: string;
  pacing: string;
  visual_elements: string[];
  cta_type: string;
  replicable_rules: string[];
};

type GlobalFormat = {
  id: string;
  name: string;
  contentType: string;
  status: string | null;
  createdAt: string | null;
};

export function GlobalFormatManager() {
  const { t } = useI18n();
  const [transcript, setTranscript] = useState("");
  const [visual, setVisual] = useState("");
  const [contentType, setContentType] = useState("reel");
  const [skeleton, setSkeleton] = useState<Skeleton | null>(null);
  const [name, setName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState<"extract" | "publish" | "upload" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<GlobalFormat[] | null>(null);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/admin/formats");
    if (res.ok) setList((await res.json()).formats);
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  async function extract() {
    setBusy("extract");
    setError(null);
    try {
      const res = await fetch("/api/admin/formats/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          visualDescription: visual || undefined,
          contentType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.error"));
        return;
      }
      setSkeleton(data.skeleton);
      setName(data.skeleton.name);
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(null);
    }
  }

  async function uploadImage(file: File) {
    setBusy("upload");
    setError(null);
    try {
      const presign = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const data = await presign.json();
      if (!presign.ok) {
        setError(data.error ?? t("common.error"));
        return;
      }
      const put = await fetch(data.url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        setError(t("common.error"));
        return;
      }
      setImages((prev) => [...prev, data.key]);
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    if (!skeleton) return;
    setBusy("publish");
    setError(null);
    try {
      const res = await fetch("/api/admin/formats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contentType,
          skeleton: { ...skeleton, name },
          sourceTranscript: transcript || undefined,
          referenceImages: images,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.error"));
        return;
      }
      setSkeleton(null);
      setTranscript("");
      setVisual("");
      setName("");
      setImages([]);
      await loadList();
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(null);
    }
  }

  async function toggleStatus(f: GlobalFormat) {
    await fetch(`/api/admin/formats/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: f.status === "active" ? "inactive" : "active",
      }),
    });
    await loadList();
  }

  return (
    <div className="space-y-6">
      {/* Crear */}
      <Card className="space-y-4">
        <h2 className="font-semibold">{t("admin.newFormat")}</h2>
        <div>
          <Label>{t("ext.transcript")}</Label>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="min-h-32"
            maxLength={15000}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t("ext.visual")}</Label>
            <Textarea
              value={visual}
              onChange={(e) => setVisual(e.target.value)}
              className="min-h-20"
            />
          </div>
          <div>
            <Label>{t("ext.type")}</Label>
            <Select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              <option value="reel">{t("gen.type.reel")}</option>
              <option value="carousel">{t("gen.type.carousel")}</option>
              <option value="story">{t("gen.type.story")}</option>
            </Select>
            <div className="mt-4">
              <Label>{t("admin.uploadRef")}</Label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                  e.target.value = "";
                }}
                className="block w-full cursor-pointer text-xs text-zinc-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white hover:file:bg-white/15"
              />
              {images.length > 0 && (
                <p className="mt-1 text-xs text-emerald-300">
                  ✓ {images.length} img
                </p>
              )}
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end">
          <Button
            onClick={extract}
            disabled={busy !== null || transcript.trim().length < 50}
            variant="secondary"
          >
            {busy === "extract" && <Spinner />}
            🧬 {t("ext.button")}
          </Button>
        </div>

        {skeleton && (
          <div className="space-y-3 rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-4">
            <div>
              <Label>{t("ext.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              {skeleton.structure.map((s, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-3 rounded-lg bg-white/5 px-3 py-1.5 text-sm"
                >
                  <span className="font-semibold text-amber-300">{s.section}</span>
                  <span className="flex-1 text-zinc-400">{s.purpose}</span>
                  <span className="font-mono text-xs text-zinc-500">
                    {s.relative_duration}
                  </span>
                </div>
              ))}
            </div>
            <ul className="list-inside list-disc text-xs text-zinc-400">
              {skeleton.replicable_rules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button onClick={publish} disabled={busy !== null || !name.trim()}>
                {busy === "publish" && <Spinner />}
                🚀 {t("admin.publish")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Lista */}
      <Card>
        <h2 className="mb-3 font-semibold">{t("admin.formatList")}</h2>
        {list === null ? (
          <div className="flex items-center gap-2 py-4 text-sm text-zinc-500">
            <Spinner /> {t("common.loading")}
          </div>
        ) : list.length === 0 ? (
          <p className="py-4 text-sm text-zinc-500">—</p>
        ) : (
          <div className="divide-y divide-white/5">
            {list.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Badge
                    color={f.status === "active" ? "emerald" : "zinc"}
                  >
                    {f.contentType}
                  </Badge>
                  <span
                    className={`truncate text-sm ${f.status !== "active" ? "text-zinc-500 line-through" : ""}`}
                  >
                    {f.name}
                  </span>
                </div>
                <button
                  onClick={() => toggleStatus(f)}
                  className="shrink-0 cursor-pointer text-xs text-zinc-400 hover:text-white"
                >
                  {f.status === "active"
                    ? t("admin.deactivate")
                    : t("admin.activate")}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
