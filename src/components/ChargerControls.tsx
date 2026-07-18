import { chargerRange } from "@/lib/calc/data";
import type { CarModel, ChargerType } from "@/lib/calc/types";
import { formatNum } from "@/lib/format";
import { IconHome, IconPlug, IconStation, IconZap } from "./icons";

const CHARGERS: { type: ChargerType; label: string; detail: string; Icon: typeof IconZap }[] = [
  { type: "EMERGENCY", label: "Tomacorriente", detail: "1,4 kW fijo", Icon: IconPlug },
  { type: "BYD", label: "Wallbox BYD", detail: "Domiciliario", Icon: IconHome },
  { type: "AC", label: "Pública AC", detail: "Carga alterna", Icon: IconStation },
  { type: "DC", label: "Rápida DC", detail: "Carga rápida", Icon: IconZap },
];

interface Props {
  model: CarModel;
  chargerType: ChargerType;
  chargerPower: number;
  actualPower: number;
  onSelectType: (type: ChargerType) => void;
  onChangePower: (kw: number) => void;
}

export function ChargerControls({ model, chargerType, chargerPower, actualPower, onSelectType, onChangePower }: Props) {
  const range = chargerRange(model, chargerType);
  const dcDisponible = model.maxDc > 0;
  const limitado = actualPower < chargerPower;

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-sm font-medium text-muted-fg mb-3">Tipo de carga</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CHARGERS.map(({ type, label, detail, Icon }) => {
            const selected = type === chargerType;
            const disabled = type === "DC" && !dcDisponible;
            return (
              <button
                key={type}
                type="button"
                disabled={disabled}
                onClick={() => onSelectType(type)}
                aria-pressed={selected}
                title={disabled ? `${model.nombre} no soporta carga DC` : undefined}
                className={`min-h-[44px] cursor-pointer rounded-xl border p-3 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                  selected
                    ? "border-primary bg-primary text-on-primary shadow-md"
                    : "border-border bg-surface hover:border-primary/60"
                }`}
              >
                <Icon className={selected ? "" : "text-primary"} />
                <span className="mt-1.5 block text-sm font-semibold leading-tight">{label}</span>
                <span className={`block text-xs ${selected ? "text-on-primary/80" : "text-muted-fg"}`}>{detail}</span>
              </button>
            );
          })}
        </div>
        {!dcDisponible && (
          <p className="mt-2 text-xs text-muted-fg">
            {model.nombre} no soporta carga rápida DC: se calcula como carga AC.
          </p>
        )}
      </fieldset>

      {!range.fixed && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="charger-power" className="text-sm font-medium text-muted-fg">
              Potencia del cargador
            </label>
            <output htmlFor="charger-power" className="font-mono text-sm font-bold text-primary">
              {formatNum(chargerPower)} kW
            </output>
          </div>
          <input
            id="charger-power"
            type="range"
            min={range.min}
            max={range.max}
            step={chargerType === "DC" ? 1 : 0.2}
            value={chargerPower}
            onChange={(e) => onChangePower(Number(e.target.value))}
            className="w-full h-11"
            aria-describedby={limitado ? "power-note" : undefined}
          />
          <div className="flex justify-between text-xs text-muted-fg font-mono">
            <span>{formatNum(range.min)} kW</span>
            <span>{formatNum(range.max)} kW</span>
          </div>
          {limitado && (
            <p id="power-note" className="mt-2 text-xs text-accent">
              El auto limita la carga a {formatNum(actualPower)} kW (máximo del cargador embarcado).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
