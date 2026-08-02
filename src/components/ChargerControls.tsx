import { BYD_WALLBOX_MAX, chargerRange, soportaWallboxBYD } from "@/lib/calc/data";
import type { CarModel, ChargerType } from "@/lib/calc/types";
import { formatNum } from "@/lib/format";
import { EmojiRange } from "./EmojiRange";
import { IconHome, IconMapPin, IconPlug, IconStation, IconZap } from "./icons";

const CHARGERS: { type: ChargerType; label: string; detail: string; Icon: typeof IconZap }[] = [
  { type: "EMERGENCY", label: "Tomacorriente", detail: "1,4 kW fijo", Icon: IconPlug },
  { type: "BYD", label: "Wallbox BYD", detail: "Domiciliario", Icon: IconHome },
  { type: "AC", label: "Pública AC", detail: "Carga alterna", Icon: IconStation },
  { type: "DC", label: "Rápida DC", detail: "Carga rápida", Icon: IconZap },
];

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=estaciones+de+carga+para+veh%C3%ADculos+el%C3%A9ctricos";

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
  const publica = chargerType === "AC" || chargerType === "DC";

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-bold text-primary">3</span>
          <span className="text-sm font-medium text-muted-fg">Elegí tipo de carga a realizar</span>
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CHARGERS.map(({ type, label, detail, Icon }) => {
            const selected = type === chargerType;
            const disabled =
              (type === "DC" && !dcDisponible) || (type === "BYD" && !soportaWallboxBYD(model));
            return (
              <button
                key={type}
                type="button"
                disabled={disabled}
                onClick={() => onSelectType(type)}
                aria-pressed={selected}
                title={disabled ? (type === "DC" ? `${model.nombre} no soporta carga DC` : `Wallbox BYD no disponible para ${model.nombre}`) : undefined}
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
        {publica && (
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors duration-200 hover:border-primary/60"
          >
            <IconMapPin width={18} height={18} className="text-accent" />
            Encontrá tu punto de carga más cercano
            <span className="text-xs text-muted-fg">(Google Maps)</span>
          </a>
        )}
      </fieldset>

      {!range.fixed && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">4</span>
              <label htmlFor="charger-power" className="text-sm font-medium text-muted-fg">
                Potencia
              </label>
            </div>
            <output htmlFor="charger-power" className="font-mono text-sm font-bold text-primary-hover">
              {formatNum(chargerPower)} kW
            </output>
          </div>
          <EmojiRange
            id="charger-power"
            min={range.min}
            max={range.max}
            step={chargerType === "DC" ? 1 : 0.2}
            value={chargerPower}
            onChange={onChangePower}
            emoji="⚡"
            ariaDescribedby={limitado ? "power-note" : undefined}
          />
          <div className="flex justify-between text-xs text-muted-fg font-mono">
            <span>{formatNum(range.min)} kW</span>
            <span>{formatNum(range.max)} kW</span>
          </div>
          {chargerType === "BYD" && (
            <p className="mt-2 text-xs text-muted-fg">
              El Wallbox BYD domiciliario entrega hasta {formatNum(BYD_WALLBOX_MAX)} kW: instalaciones
              de más potencia son raras en la Argentina.
            </p>
          )}
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
