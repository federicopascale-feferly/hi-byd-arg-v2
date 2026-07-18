import {
  DC_TAPER_FACTOR,
  DC_TAPER_START,
  DEFAULT_TARGET_PERCENT,
  EFFICIENCY,
  EMERGENCY_POWER,
  SHELL_PRECIO_MIN,
  TARIFAS,
  shellDisponible,
} from './data';
import type { ChargeInput, ChargeResult, ChargerType } from './types';

/** Si el auto no soporta DC, la carga DC se fuerza a AC (§1.2) */
export function effectiveChargerType(maxDc: number, chargerType: ChargerType): ChargerType {
  return chargerType === 'DC' && maxDc === 0 ? 'AC' : chargerType;
}

export function calculateCharge(input: ChargeInput): ChargeResult {
  const { model, currentBattery, tarifaId } = input;
  const targetPercent = input.targetPercent ?? DEFAULT_TARGET_PERCENT;

  const chargerType = effectiveChargerType(model.maxDc, input.chargerType);
  const chargerPower = chargerType === 'EMERGENCY' ? EMERGENCY_POWER : input.chargerPower;

  const percentageToCharge = Math.max(targetPercent - currentBattery, 0);
  const targetEnergyKw = (percentageToCharge / 100) * model.batteryKw;
  const addedRangeKm = Math.round((percentageToCharge / 100) * model.electricRange);

  const maxCarPower = chargerType === 'DC' ? model.maxDc : model.maxAc;
  const actualChargingPower = Math.min(chargerPower, maxCarPower);

  let timeInHours: number;
  const esCurvaEstimada = chargerType === 'DC';

  if (chargerType === 'DC') {
    // Curva de taper por tramos (§3.3): potencia plena hasta 75% SoC, 35% del pico de ahí a 100%
    const tramo1Pct = Math.min(targetPercent, DC_TAPER_START) - Math.min(currentBattery, DC_TAPER_START);
    const tramo2Pct = Math.max(targetPercent - DC_TAPER_START, 0) - Math.max(currentBattery - DC_TAPER_START, 0);

    const energiaTramo1 = (Math.max(tramo1Pct, 0) / 100) * model.batteryKw;
    const energiaTramo2 = (Math.max(tramo2Pct, 0) / 100) * model.batteryKw;

    const tiempoTramo1 = energiaTramo1 / actualChargingPower / EFFICIENCY;
    const tiempoTramo2 = energiaTramo2 / (actualChargingPower * DC_TAPER_FACTOR) / EFFICIENCY;

    timeInHours = tiempoTramo1 + tiempoTramo2;
  } else {
    timeInHours = targetEnergyKw / actualChargingPower / EFFICIENCY;
  }

  const tarifa = TARIFAS.find((t) => t.id === tarifaId);
  if (!tarifa) throw new Error(`Tarifa desconocida: ${tarifaId}`);
  const costoSesion = targetEnergyKw * tarifa.precioKwh;

  const costoShell = shellDisponible(model, chargerType) ? timeInHours * 60 * SHELL_PRECIO_MIN : null;

  return {
    chargerType,
    percentageToCharge,
    targetEnergyKw,
    addedRangeKm,
    actualChargingPower,
    timeInHours,
    costoSesion,
    costoShell,
    esCurvaEstimada,
  };
}

/** "5h 36m" a partir de horas decimales */
export function formatHours(timeInHours: number): string {
  const totalMin = Math.round(timeInHours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}
