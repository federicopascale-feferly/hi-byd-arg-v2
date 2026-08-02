"use client";

import { useEffect, useState } from "react";
import { buildPdf, buildPng, canShareFile, downloadBlob, type ShareCardData } from "@/lib/share/card";
import { IconDownload, IconShare } from "./icons";

type Busy = "share" | "pdf" | null;

interface Props {
  data: ShareCardData;
}

export function ShareResults({ data }: Props) {
  const [puedeCompartir, setPuedeCompartir] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  // El share sheet nativo sólo existe en algunos navegadores (sobre todo móviles).
  // Se resuelve después del montaje para no romper la hidratación.
  useEffect(() => {
    setPuedeCompartir(canShareFile(new File([""], "probe.png", { type: "image/png" })));
  }, []);

  const compartir = async () => {
    setBusy("share");
    setError(null);
    try {
      const { blob, filename } = await buildPng(data);
      const file = new File([blob], filename, { type: "image/png" });

      if (canShareFile(file)) {
        await navigator.share({
          files: [file],
          title: "Mi carga en Hi BYD Argentina",
          text: `${data.modelo}: ${data.tiempo} de carga (${data.desdePct}% → ${data.hastaPct}%).`,
        });
      } else {
        downloadBlob(blob, filename);
      }
    } catch (e) {
      // Cancelar el share sheet lanza AbortError: no es un error que haya que mostrar
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError("No se pudo generar la imagen. Probá de nuevo.");
    } finally {
      setBusy(null);
    }
  };

  const descargarPdf = async () => {
    setBusy("pdf");
    setError(null);
    try {
      const { blob, filename } = await buildPdf(data);
      downloadBlob(blob, filename);
    } catch {
      setError("No se pudo generar el PDF. Probá de nuevo.");
    } finally {
      setBusy(null);
    }
  };

  const btn =
    "inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={compartir}
          disabled={busy !== null}
          className={`${btn} bg-primary text-on-primary hover:bg-primary-hover`}
        >
          <IconShare width={18} height={18} />
          {busy === "share" ? "Generando…" : puedeCompartir ? "Compartir" : "Descargar imagen"}
        </button>

        <button
          type="button"
          onClick={descargarPdf}
          disabled={busy !== null}
          className={`${btn} border border-border bg-surface hover:border-primary/60`}
        >
          <IconDownload width={18} height={18} className="text-primary" />
          {busy === "pdf" ? "Generando…" : "Descargar PDF"}
        </button>
      </div>

      <p className="mt-2 text-xs text-muted-fg">
        {puedeCompartir
          ? "Compartí tu cálculo por WhatsApp o redes como imagen, o descargalo en PDF."
          : "Descargá tu cálculo como imagen para compartir en redes, o en PDF para guardarlo."}
      </p>

      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
