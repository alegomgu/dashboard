"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";

export function CaptureSnapshotButton() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function capture() {
    setMessage(null);
    setIsCapturing(true);
    try {
      const response = await fetch("/api/snapshots/capture", {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as { health?: { totalSnapshots?: number } };
      setMessage(
        `Snapshot guardado${payload.health?.totalSnapshots ? ` · ${payload.health.totalSnapshots} puntos` : ""}`,
      );
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo capturar");
    } finally {
      setIsCapturing(false);
    }
  }

  const loading = isCapturing || isPending;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={capture}
        disabled={loading}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-panel shadow-sm transition disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? (
          <Loader2 size={17} className="animate-spin" aria-hidden="true" />
        ) : (
          <Camera size={17} aria-hidden="true" />
        )}
        Actualizar snapshot
      </button>
      {message ? <p className="text-xs font-medium text-muted">{message}</p> : null}
    </div>
  );
}
