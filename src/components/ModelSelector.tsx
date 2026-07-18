import type { CarModel } from "@/lib/calc/types";
import { formatNum } from "@/lib/format";

interface Props {
  models: CarModel[];
  selectedId: string;
  onSelect: (model: CarModel) => void;
}

export function ModelSelector({ models, selectedId, onSelect }: Props) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-muted-fg mb-3">Modelo</legend>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {models.map((m) => {
          const selected = m.id === selectedId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m)}
              aria-pressed={selected}
              className={`min-h-[44px] cursor-pointer rounded-xl border p-3 text-left transition-colors duration-200 focus-visible:outline-2 ${
                selected
                  ? "border-primary bg-primary text-on-primary shadow-md"
                  : "border-border bg-surface hover:border-primary/60"
              }`}
            >
              <span className="block text-sm font-semibold leading-tight">{m.nombre}</span>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-mono ${
                  selected ? "bg-on-primary/20" : "bg-white/10 text-muted-fg"
                }`}
              >
                {m.tipo}
              </span>
              <span className={`mt-1 block text-xs ${selected ? "text-on-primary/80" : "text-muted-fg"}`}>
                {formatNum(m.batteryKw)} kWh · {m.electricRange} km
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
