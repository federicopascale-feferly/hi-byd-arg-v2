"use client";

import { useState } from "react";
import type { CarModel } from "@/lib/calc/types";
import { formatNum } from "@/lib/format";

interface Props {
  models: CarModel[];
  selectedId: string;
  onSelect: (model: CarModel) => void;
}

export function ModelSelector({ models, selectedId, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);
  const selected = models.find((m) => m.id === selectedId) ?? models[0];

  if (!expanded) {
    return (
      <section aria-label="Modelo seleccionado">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-fg">Modelos disponibles en Argentina</h2>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-primary-hover transition-colors duration-200 hover:bg-primary/15"
          >
            Cambiar modelo
          </button>
        </div>
        <div className="rounded-xl border border-primary bg-primary p-4 text-on-primary shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">{selected.nombre}</span>
            <span className="rounded-full bg-on-primary/20 px-2 py-0.5 font-mono text-[11px]">
              {selected.tipo}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-on-primary/90">{selected.descripcion}</p>
          <p className="mt-2 font-mono text-xs text-on-primary/80">
            {formatNum(selected.batteryKw)} kWh · {selected.electricRange} km eléctricos ·{" "}
            {selected.maxDc > 0 ? `DC hasta ${formatNum(selected.maxDc)} kW` : "sin carga rápida DC"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-muted-fg mb-3">
        Modelos disponibles en Argentina
      </legend>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {models.map((m) => {
          const isSelected = m.id === selectedId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSelect(m);
                setExpanded(false);
              }}
              aria-pressed={isSelected}
              className={`min-h-[44px] cursor-pointer rounded-xl border p-3 text-left transition-colors duration-200 focus-visible:outline-2 ${
                isSelected
                  ? "border-primary bg-primary text-on-primary shadow-md"
                  : "border-border bg-surface hover:border-primary/60"
              }`}
            >
              <span className="block text-sm font-semibold leading-tight">{m.nombre}</span>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-mono ${
                  isSelected ? "bg-on-primary/20" : "bg-white/10 text-muted-fg"
                }`}
              >
                {m.tipo}
              </span>
              <span className={`mt-1 block text-xs ${isSelected ? "text-on-primary/80" : "text-muted-fg"}`}>
                {formatNum(m.batteryKw)} kWh · {m.electricRange} km
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
