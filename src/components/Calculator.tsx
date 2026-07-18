"use client";

import { useState } from "react";
import {
  CAR_MODELS,
  DEFAULT_CONSUMO_REFERENCIA,
  DEFAULT_PRECIO_NAFTA,
  DEFAULT_TARGET_PERCENT,
  chargerRange,
  tarifasDisponibles,
} from "@/lib/calc/data";
import { calculateCharge, effectiveChargerType } from "@/lib/calc/engine";
import { costoPorKm } from "@/lib/calc/costoPorKm";
import type { CarModel, ChargerType, TarifaId } from "@/lib/calc/types";
import { formatNum } from "@/lib/format";
import { ChargerControls } from "./ChargerControls";
import { ModelSelector } from "./ModelSelector";
import { PaybackSection } from "./PaybackSection";
import { ResultsPanel } from "./ResultsPanel";
import { TariffPicker } from "./TariffPicker";
import { IconFuel } from "./icons";

const clampPower = (model: CarModel, type: ChargerType, power: number) => {
  const r = chargerRange(model, type);
  return r.fixed ? r.min : Math.min(Math.max(power, r.min), r.max);
};

export function Calculator() {
  const [model, setModel] = useState<CarModel>(CAR_MODELS[3]); // Dolphin Mini GS
  const [chargerType, setChargerType] = useState<ChargerType>("BYD");
  const [chargerPower, setChargerPower] = useState(6.6);
  const [currentBattery, setCurrentBattery] = useState(20);
  const [tarifaId, setTarifaId] = useState<TarifaId>("EPE");
  const [precioNafta, setPrecioNafta] = useState(DEFAULT_PRECIO_NAFTA);
  const [unidadConsumo, setUnidadConsumo] = useState<"l100" | "kml">("l100");
  const [consumoValor, setConsumoValor] = useState(DEFAULT_CONSUMO_REFERENCIA);

  // El motor siempre trabaja en l/100km; km/l se convierte (l/100km = 100 / km/l)
  const consumoReferencia = unidadConsumo === "l100" ? consumoValor : 100 / consumoValor;

  const cambiarUnidad = (u: "l100" | "kml") => {
    if (u === unidadConsumo) return;
    setUnidadConsumo(u);
    setConsumoValor((v) => Number((100 / v).toFixed(1)));
  };

  const tarifas = tarifasDisponibles(chargerType);
  const tarifa = tarifas.find((t) => t.id === tarifaId) ?? tarifas[0];

  const selectModel = (m: CarModel) => {
    const type = effectiveChargerType(m.maxDc, chargerType);
    setModel(m);
    setChargerType(type);
    setChargerPower((p) => clampPower(m, type, p));
  };

  const selectChargerType = (type: ChargerType) => {
    setChargerType(type);
    setChargerPower((p) => clampPower(model, type, p));
    const disponibles = tarifasDisponibles(type);
    if (!disponibles.some((t) => t.id === tarifaId)) setTarifaId(disponibles[0].id);
  };

  const result = calculateCharge({
    model,
    chargerType,
    chargerPower,
    currentBattery,
    tarifaId: tarifa.id,
  });

  const costoKm = costoPorKm({
    costoSesion: result.costoSesion,
    addedRangeKm: result.addedRangeKm,
    precioNafta,
    consumoReferencia,
  });

  return (
    <>
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
      <div className="space-y-6 rounded-2xl border border-border bg-surface p-6 backdrop-blur">
        <ModelSelector models={CAR_MODELS} selectedId={model.id} onSelect={selectModel} />

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="current-battery" className="text-sm font-medium text-muted-fg">
              Batería actual
            </label>
            <output htmlFor="current-battery" className="font-mono text-sm font-bold text-primary">
              {formatNum(currentBattery)}%
            </output>
          </div>
          <input
            id="current-battery"
            type="range"
            min={0}
            max={100}
            step={1}
            value={currentBattery}
            onChange={(e) => setCurrentBattery(Number(e.target.value))}
            className="w-full h-11"
          />
          <div className="flex justify-between text-xs text-muted-fg font-mono">
            <span>0%</span>
            <span>Objetivo: {DEFAULT_TARGET_PERCENT}%</span>
            <span>100%</span>
          </div>
        </div>

        <ChargerControls
          model={model}
          chargerType={result.chargerType}
          chargerPower={chargerPower}
          actualPower={result.actualChargingPower}
          onSelectType={selectChargerType}
          onChangePower={setChargerPower}
        />

        <TariffPicker tarifas={tarifas} selectedId={tarifa.id} onSelect={setTarifaId} />

        <fieldset>
          <legend className="flex items-center gap-2 text-sm font-medium text-muted-fg mb-3">
            <IconFuel width={16} height={16} className="text-primary" />
            Comparar con nafta
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="precio-nafta" className="block text-xs text-muted-fg mb-1">
                Precio nafta ($/litro)
              </label>
              <input
                id="precio-nafta"
                type="number"
                min={0}
                step={10}
                value={precioNafta}
                onChange={(e) => setPrecioNafta(Math.max(Number(e.target.value), 0))}
                className="w-full min-h-[44px] rounded-xl border border-border bg-input-bg px-3 font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="consumo-ref" className="block text-xs text-muted-fg mb-1">
                Consumo ({unidadConsumo === "l100" ? "l/100 km" : "km/litro"})
              </label>
              <input
                id="consumo-ref"
                type="number"
                min={1}
                step={0.5}
                value={consumoValor}
                onChange={(e) => setConsumoValor(Math.max(Number(e.target.value), 1))}
                className="w-full min-h-[44px] rounded-xl border border-border bg-input-bg px-3 font-mono text-sm"
              />
              <div
                role="group"
                aria-label="Unidad de consumo"
                className="mt-2 inline-flex rounded-lg border border-border p-0.5"
              >
                {(
                  [
                    { id: "l100", label: "l/100" },
                    { id: "kml", label: "km/l" },
                  ] as const
                ).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => cambiarUnidad(u.id)}
                    aria-pressed={unidadConsumo === u.id}
                    className={`cursor-pointer rounded-md px-3 py-1.5 font-mono text-xs transition-colors duration-200 ${
                      unidadConsumo === u.id
                        ? "bg-primary text-on-primary"
                        : "text-muted-fg hover:text-foreground"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </fieldset>
      </div>

      <div className="lg:sticky lg:top-6">
        <ResultsPanel
          model={model}
          result={result}
          costoKm={costoKm}
          tarifa={tarifa}
          targetPercent={DEFAULT_TARGET_PERCENT}
          currentBattery={currentBattery}
        />
      </div>
    </div>
    <PaybackSection targetEnergyKw={result.targetEnergyKw} />
    </>
  );
}
