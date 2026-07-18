import { DEFAULT_CONSUMO_REFERENCIA, DEFAULT_PRECIO_NAFTA } from './data';
import type { CostoPorKmInput, CostoPorKmResult } from './types';

/**
 * Costo por km eléctrico vs nafta (§4.1).
 * Para PHEV solo vale para el tramo recorrido en modo 100% eléctrico.
 */
export function costoPorKm(input: CostoPorKmInput): CostoPorKmResult | null {
  const precioNafta = input.precioNafta ?? DEFAULT_PRECIO_NAFTA;
  const consumoReferencia = input.consumoReferencia ?? DEFAULT_CONSUMO_REFERENCIA;

  if (input.addedRangeKm <= 0) return null;

  const costoPorKmElectrico = input.costoSesion / input.addedRangeKm;
  const costoPorKmNafta = (precioNafta * consumoReferencia) / 100;
  const ahorroPorKm = costoPorKmNafta - costoPorKmElectrico;
  const ahorroPorcentual = (ahorroPorKm / costoPorKmNafta) * 100;

  return { costoPorKmElectrico, costoPorKmNafta, ahorroPorKm, ahorroPorcentual };
}
