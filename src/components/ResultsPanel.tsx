import type { CarModel, ChargeResult, CostoPorKmResult, Tarifa } from "@/lib/calc/types";
import { formatHours } from "@/lib/calc/engine";
import { formatARS, formatARSFino, formatNum } from "@/lib/format";
import { IconBattery, IconClock, IconFuel, IconInfo, IconRoad, IconZap } from "./icons";

interface Props {
  model: CarModel;
  result: ChargeResult;
  costoKm: CostoPorKmResult | null;
  tarifa: Tarifa;
  targetPercent: number;
  currentBattery: number;
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <dt className="text-xs text-muted-fg">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-bold">
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-muted-fg">{unit}</span>}
      </dd>
    </div>
  );
}

export function ResultsPanel({ model, result, costoKm, tarifa, targetPercent, currentBattery }: Props) {
  if (result.percentageToCharge <= 0) {
    return (
      <section aria-label="Resultados" className="rounded-2xl border border-border bg-surface p-6 backdrop-blur">
        <div className="flex items-start gap-3 text-muted-fg">
          <IconBattery className="mt-0.5 shrink-0 text-success" />
          <p className="text-sm">
            La batería ya está en o por encima del objetivo del {targetPercent}%. No hace falta cargar.
          </p>
        </div>
      </section>
    );
  }

  const pctElectrico = costoKm ? Math.min((costoKm.costoPorKmElectrico / costoKm.costoPorKmNafta) * 100, 100) : 0;

  return (
    <section aria-label="Resultados" className="rounded-2xl border border-border bg-surface p-6 backdrop-blur space-y-6">
      <div>
        <div className="flex items-center gap-2 text-muted-fg">
          <IconClock className="text-primary" />
          <h2 className="text-sm font-medium">Tiempo de carga estimado</h2>
        </div>
        <p className="mt-2 font-mono text-5xl font-bold tracking-tight text-primary">
          {formatHours(result.timeInHours)}
        </p>
        <p className="mt-1 text-sm text-muted-fg">
          {model.nombre} · {formatNum(currentBattery)}% → {targetPercent}% ·{" "}
          {formatNum(result.actualChargingPower)} kW
        </p>
        {result.esCurvaEstimada && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-muted-fg">
            <IconInfo width={14} height={14} />
            Curva DC estimada (taper desde 75%), no es dato de fábrica
          </p>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <Stat label="Energía a cargar" value={formatNum(result.targetEnergyKw)} unit="kWh" />
        <Stat label="Autonomía agregada" value={`+${result.addedRangeKm}`} unit="km" />
        <Stat label={`Costo sesión · ${tarifa.nombre}`} value={formatARS(result.costoSesion)} />
        {result.costoShell !== null ? (
          <Stat label="Shell (cobra por minuto)" value={formatARS(result.costoShell)} />
        ) : (
          <Stat label="Potencia efectiva" value={formatNum(result.actualChargingPower)} unit="kW" />
        )}
      </dl>

      {costoKm && (
        <div>
          <div className="flex items-center gap-2 text-muted-fg">
            <IconRoad className="text-primary" />
            <h3 className="text-sm font-medium">Costo por km</h3>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <IconZap width={14} height={14} className="text-success" /> Eléctrico
                </span>
                <span className="font-mono font-bold text-success">{formatARSFino(costoKm.costoPorKmElectrico)}/km</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/10" role="presentation">
                <div className="h-2 rounded-full bg-success" style={{ width: `${pctElectrico}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <IconFuel width={14} height={14} className="text-muted-fg" /> Nafta
                </span>
                <span className="font-mono font-bold">{formatARSFino(costoKm.costoPorKmNafta)}/km</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/10" role="presentation">
                <div className="h-2 rounded-full bg-muted-fg" style={{ width: "100%" }} />
              </div>
            </div>
          </div>

          <p className="mt-3 rounded-xl bg-success/10 px-4 py-3 text-sm">
            <span className="font-mono font-bold text-success">
              {costoKm.ahorroPorcentual >= 0 ? "-" : "+"}
              {formatNum(Math.abs(costoKm.ahorroPorcentual))}%
            </span>{" "}
            {costoKm.ahorroPorcentual >= 0 ? "de ahorro" : "más caro"} por km vs. nafta (
            {formatARSFino(Math.abs(costoKm.ahorroPorKm))}/km)
          </p>

          {model.tipo === "PHEV" && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-fg">
              <IconInfo width={14} height={14} className="mt-0.5 shrink-0" />
              Por ser híbrido enchufable, el costo por km vale solo para tramos en modo 100% eléctrico.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
