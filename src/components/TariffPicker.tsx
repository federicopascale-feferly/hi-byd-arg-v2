import type { Tarifa, TarifaId } from "@/lib/calc/types";
import { formatARS } from "@/lib/format";

interface Props {
  tarifas: Tarifa[];
  selectedId: TarifaId;
  onSelect: (id: TarifaId) => void;
}

export function TariffPicker({ tarifas, selectedId, onSelect }: Props) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-muted-fg mb-3">Tarifa eléctrica</legend>
      <div className="grid grid-cols-2 gap-2">
        {tarifas.map((t) => {
          const selected = t.id === selectedId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              aria-pressed={selected}
              className={`min-h-[44px] cursor-pointer rounded-xl border p-3 text-left transition-colors duration-200 ${
                selected
                  ? "border-primary bg-primary text-on-primary shadow-md"
                  : "border-border bg-surface hover:border-primary/60"
              }`}
            >
              <span className="block text-sm font-semibold">{t.nombre}</span>
              <span className={`block text-xs font-mono ${selected ? "text-on-primary/80" : "text-muted-fg"}`}>
                {formatARS(t.precioKwh)}/kWh
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
