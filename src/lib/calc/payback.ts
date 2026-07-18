import {
  DEFAULT_COSTO_CARGADOR_USD,
  DEFAULT_COSTO_INSTALACION_USD,
  DEFAULT_TIPO_CAMBIO,
  TARIFAS,
} from './data';
import type { TarifaId } from './types';

export interface PaybackInput {
  /** kWh de la sesión de referencia (targetEnergyKw del cálculo actual) */
  targetEnergyKw: number;
  /** Costo del cargador en USD (default 0: bonificado por BYD) */
  costoCargadorUsd?: number;
  /** Costo de instalación en USD */
  costoInstalacionUsd?: number;
  /** Tipo de cambio ARS por USD */
  tipoCambio?: number;
  /** Tarifa domiciliaria contra la que se carga con el Wallbox */
  tarifaDomiciliariaId?: TarifaId;
  /** Tarifa pública que se evita usando el Wallbox */
  tarifaPublicaId?: TarifaId;
}

export interface PaybackResult {
  costoTotalUsd: number;
  costoTotalArs: number;
  costoPorSesionWallbox: number;
  costoPorSesionPublico: number;
  /** ARS que se ahorra cada carga hecha en casa en vez de en la red pública */
  ahorroPorSesion: number;
  /** Cargas necesarias para recuperar la inversión (0 = amortización inmediata) */
  cargasParaAmortizar: number;
}

const precioKwh = (id: TarifaId) => {
  const t = TARIFAS.find((t) => t.id === id);
  if (!t) throw new Error(`Tarifa desconocida: ${id}`);
  return t.precioKwh;
};

/**
 * Amortización del Wallbox BYD (spec §4.5 adaptada): equipo + instalación en USD,
 * ahorro por sesión = misma carga en tarifa pública vs. domiciliaria.
 * Devuelve null si la sesión de referencia no carga nada (no hay ahorro contra el que amortizar).
 */
export function paybackWallbox(input: PaybackInput): PaybackResult | null {
  const costoCargadorUsd = input.costoCargadorUsd ?? DEFAULT_COSTO_CARGADOR_USD;
  const costoInstalacionUsd = input.costoInstalacionUsd ?? DEFAULT_COSTO_INSTALACION_USD;
  const tipoCambio = input.tipoCambio ?? DEFAULT_TIPO_CAMBIO;

  if (input.targetEnergyKw <= 0) return null;

  const costoPorSesionWallbox = input.targetEnergyKw * precioKwh(input.tarifaDomiciliariaId ?? 'EPE');
  const costoPorSesionPublico = input.targetEnergyKw * precioKwh(input.tarifaPublicaId ?? 'YPF');
  const ahorroPorSesion = costoPorSesionPublico - costoPorSesionWallbox;
  if (ahorroPorSesion <= 0) return null;

  const costoTotalUsd = costoCargadorUsd + costoInstalacionUsd;
  const costoTotalArs = costoTotalUsd * tipoCambio;
  const cargasParaAmortizar = Math.ceil(costoTotalArs / ahorroPorSesion);

  return {
    costoTotalUsd,
    costoTotalArs,
    costoPorSesionWallbox,
    costoPorSesionPublico,
    ahorroPorSesion,
    cargasParaAmortizar,
  };
}
