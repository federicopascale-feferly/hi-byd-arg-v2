"use client";

import { useState } from "react";
import {
  DEFAULT_COSTO_CARGADOR_USD,
  DEFAULT_COSTO_INSTALACION_USD,
  DEFAULT_TIPO_CAMBIO,
  TARIFAS,
} from "@/lib/calc/data";
import { paybackWallbox } from "@/lib/calc/payback";
import type { TarifaId } from "@/lib/calc/types";
import { formatARS, formatNum, formatUSD } from "@/lib/format";
import { IconHome, IconInfo } from "./icons";

interface Props {
  /** kWh de la sesión configurada arriba en la calculadora */
  targetEnergyKw: number;
}

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-border bg-input-bg px-3 font-mono text-sm";

function CampoUsd({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-muted-fg mb-1">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        step={50}
        value={value}
        onChange={(e) => onChange(Math.max(Number(e.target.value), 0))}
        className={inputClass}
      />
      {hint && <p className="mt-1 text-[11px] text-accent">{hint}</p>}
    </div>
  );
}

export function PaybackSection({ targetEnergyKw }: Props) {
  const [costoCargadorUsd, setCostoCargadorUsd] = useState(DEFAULT_COSTO_CARGADOR_USD);
  const [costoInstalacionUsd, setCostoInstalacionUsd] = useState(DEFAULT_COSTO_INSTALACION_USD);
  const [tipoCambio, setTipoCambio] = useState(DEFAULT_TIPO_CAMBIO);
  const [tarifaDomiciliariaId, setTarifaDomiciliariaId] = useState<TarifaId>("EPE");
  const [tarifaPublicaId, setTarifaPublicaId] = useState<TarifaId>("YPF");

  const result = paybackWallbox({
    targetEnergyKw,
    costoCargadorUsd,
    costoInstalacionUsd,
    tipoCambio,
    tarifaDomiciliariaId,
    tarifaPublicaId,
  });

  const domiciliarias = TARIFAS.filter((t) => t.domiciliaria);
  const publicas = TARIFAS.filter((t) => !t.domiciliaria);

  return (
    <section
      aria-label="Amortización del Wallbox"
      className="mt-6 rounded-2xl border border-border bg-surface p-6 backdrop-blur"
    >
      <div className="flex items-center gap-2 text-muted-fg">
        <IconHome className="text-primary-hover" />
        <h2 className="text-sm font-medium">¿Cuándo se amortiza instalar un Wallbox?</h2>
      </div>
      <p className="mt-2 text-sm text-muted-fg">
        Cada carga en casa cuesta menos que en la red pública. Con el ahorro por carga, esto dice
        cuántas cargas como la que configuraste arriba hacen falta para recuperar la inversión.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CampoUsd
          id="costo-cargador"
          label="Cargador (USD)"
          value={costoCargadorUsd}
          onChange={setCostoCargadorUsd}
          hint={costoCargadorUsd === 0 ? "Bonificado por BYD con el 0km" : undefined}
        />
        <CampoUsd
          id="costo-instalacion"
          label="Instalación (USD)"
          value={costoInstalacionUsd}
          onChange={setCostoInstalacionUsd}
        />
        <CampoUsd
          id="tipo-cambio"
          label="Tipo de cambio ($/USD)"
          value={tipoCambio}
          onChange={setTipoCambio}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tarifa-casa" className="block text-xs text-muted-fg mb-1">
            Tarifa domiciliaria
          </label>
          <select
            id="tarifa-casa"
            value={tarifaDomiciliariaId}
            onChange={(e) => setTarifaDomiciliariaId(e.target.value as TarifaId)}
            className={`${inputClass} cursor-pointer`}
          >
            {domiciliarias.map((t) => (
              <option key={t.id} value={t.id} className="bg-elevated">
                {t.nombre} — {formatARS(t.precioKwh)}/kWh
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tarifa-publica" className="block text-xs text-muted-fg mb-1">
            Carga pública que evitás
          </label>
          <select
            id="tarifa-publica"
            value={tarifaPublicaId}
            onChange={(e) => setTarifaPublicaId(e.target.value as TarifaId)}
            className={`${inputClass} cursor-pointer`}
          >
            {publicas.map((t) => (
              <option key={t.id} value={t.id} className="bg-elevated">
                {t.nombre} — {formatARS(t.precioKwh)}/kWh
              </option>
            ))}
          </select>
        </div>
      </div>

      {result === null ? (
        <p className="mt-4 flex items-start gap-1.5 text-sm text-muted-fg">
          <IconInfo width={16} height={16} className="mt-0.5 shrink-0" />
          Configurá arriba una carga con energía a cargar para calcular la amortización.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-elevated p-3">
              <dt className="text-xs text-muted-fg">Inversión total</dt>
              <dd className="mt-1 font-mono text-lg font-bold">
                {formatUSD(result.costoTotalUsd)}
                <span className="ml-1 text-xs font-normal text-muted-fg">
                  ≈ {formatARS(result.costoTotalArs)}
                </span>
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-elevated p-3">
              <dt className="text-xs text-muted-fg">Ahorro por carga en casa</dt>
              <dd className="mt-1 font-mono text-lg font-bold text-success">
                {formatARS(result.ahorroPorSesion)}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-elevated p-3">
              <dt className="text-xs text-muted-fg">Por carga: casa vs. pública</dt>
              <dd className="mt-1 font-mono text-lg font-bold">
                {formatARS(result.costoPorSesionWallbox)}
                <span className="mx-1 text-xs font-normal text-muted-fg">vs.</span>
                {formatARS(result.costoPorSesionPublico)}
              </dd>
            </div>
          </dl>

          <p className="rounded-xl bg-primary/15 px-4 py-3 text-sm">
            {result.cargasParaAmortizar === 0 ? (
              <>
                <span className="font-bold text-success">Amortización inmediata:</span> con el
                cargador bonificado y sin costo de instalación, ahorrás desde la primera carga.
              </>
            ) : (
              <>
                Necesitás{" "}
                <span className="font-mono font-bold text-primary-hover">
                  {formatNum(result.cargasParaAmortizar)} cargas
                </span>{" "}
                como esta para amortizar la inversión. De ahí en más, cada carga en casa es ahorro
                neto.
              </>
            )}
          </p>
        </div>
      )}
    </section>
  );
}
