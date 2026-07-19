import type { Tarifa, TarifaId } from "@/lib/calc/types";
import { formatARS } from "@/lib/format";

interface Props {
  tarifas: Tarifa[];
  selectedId: TarifaId;
  onSelect: (id: TarifaId) => void;
  precioKwhPersonalizado?: number;
  onChangePrecioPersonalizado?: (precio: number | undefined) => void;
}

export function TariffPicker({
  tarifas,
  selectedId,
  onSelect,
  precioKwhPersonalizado,
  onChangePrecioPersonalizado,
}: Props) {
  const comboPrecio = selectedId === "COMBO" ? precioKwhPersonalizado : undefined;

  return (
    <fieldset>
      <legend className="text-sm font-medium text-muted-fg mb-3">Tarifa eléctrica</legend>
      <div className="grid grid-cols-2 gap-2">
        {tarifas.map((t) => {
          const selected = t.id === selectedId;
          const precio = t.id === "COMBO" && comboPrecio !== undefined ? comboPrecio : t.precioKwh;
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
                {formatARS(precio)}/kWh
              </span>
            </button>
          );
        })}
      </div>
      {selectedId === "COMBO" && onChangePrecioPersonalizado && (
        <div className="mt-4 space-y-2">
          <label htmlFor="combo-price" className="block text-sm font-medium text-muted-fg">
            Precio personalizado (ARS/kWh)
          </label>
          <input
            id="combo-price"
            type="number"
            min="0"
            step="0.01"
            value={comboPrecio ?? ""}
            onChange={(e) => onChangePrecioPersonalizado(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Ingresá el precio"
            className="w-full min-h-[40px] rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-fg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
      )}
    </fieldset>
  );
}
