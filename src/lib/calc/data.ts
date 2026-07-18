import type { CarModel, ChargerType, Tarifa } from './types';

/** Eficiencia de carga (red → batería), calibrada con dato real: 38.3 kWh de red → 33.26 kWh útiles */
export const EFFICIENCY = 0.87;

/** % objetivo de carga por defecto (Fase 1: fijo) */
export const DEFAULT_TARGET_PERCENT = 80;

/** SoC donde arranca el taper DC (modelo "Flat LFP", estimado) */
export const DC_TAPER_START = 75;
/** Fracción de la potencia pico durante el taper DC */
export const DC_TAPER_FACTOR = 0.35;

const isCompact = (id: string) => id === 'atto-2' || id.startsWith('song-pro');

const raw = [
  { id: 'atto-2', nombre: 'ATTO 2', tipo: 'PHEV', batteryKw: 18.3, maxAc: 6.6, maxDc: 0, electricRange: 110 },
  { id: 'yuan-pro', nombre: 'Yuan Pro', tipo: 'EV', batteryKw: 45.1, maxAc: 6.6, maxDc: 65, electricRange: 380 },
  { id: 'dolphin-mini-gl', nombre: 'Dolphin Mini GL', tipo: 'EV', batteryKw: 30.08, maxAc: 6.6, maxDc: 65, electricRange: 300 },
  { id: 'dolphin-mini-gs', nombre: 'Dolphin Mini GS', tipo: 'EV', batteryKw: 43.2, maxAc: 6.6, maxDc: 85, electricRange: 400 },
  { id: 'shark', nombre: 'Shark', tipo: 'PHEV', batteryKw: 29.58, maxAc: 6.6, maxDc: 40, electricRange: 100 },
  { id: 'song-pro-gl', nombre: 'Song Pro GL', tipo: 'PHEV', batteryKw: 12.9, maxAc: 6.6, maxDc: 0, electricRange: 71 },
  { id: 'song-pro-gs', nombre: 'Song Pro GS', tipo: 'PHEV', batteryKw: 18.3, maxAc: 6.6, maxDc: 0, electricRange: 110 },
] as const;

export const CAR_MODELS: CarModel[] = raw.map((m) => ({ ...m, isCompact: isCompact(m.id) }));

export const TARIFAS: Tarifa[] = [
  { id: 'EPE', nombre: 'EPE Santa Fe', precioKwh: 350, domiciliaria: true },
  { id: 'EDELAP', nombre: 'EDELAP', precioKwh: 312, domiciliaria: true },
  { id: 'YPF', nombre: 'YPF', precioKwh: 892, domiciliaria: false },
  { id: 'CHARGEBOX', nombre: 'ChargeBox', precioKwh: 700, domiciliaria: false },
];

/** Shell cobra por minuto, solo carga pública DC */
export const SHELL_PRECIO_MIN = 609;

export const EMERGENCY_POWER = 1.4;

/** Defaults sección 4.1 (precio nafta actualizado jul-2026) */
export const DEFAULT_PRECIO_NAFTA = 2300;
export const DEFAULT_CONSUMO_REFERENCIA = 8.5;

/** Defaults amortización del Wallbox (§4.5 adaptada): precios de equipo/instalación en USD */
export const DEFAULT_COSTO_CARGADOR_USD = 0; // bonificado por BYD
export const DEFAULT_COSTO_INSTALACION_USD = 500;
export const DEFAULT_TIPO_CAMBIO = 1500; // ARS por USD, oficial jul-2026, editable

export interface ChargerRange {
  min: number;
  max: number;
  fixed: boolean;
}

/** Rango del slider de potencia según tipo de cargador y modelo (§1.2) */
export function chargerRange(model: CarModel, chargerType: ChargerType): ChargerRange {
  switch (chargerType) {
    case 'EMERGENCY':
      return { min: EMERGENCY_POWER, max: EMERGENCY_POWER, fixed: true };
    case 'BYD':
    case 'AC':
      return { min: 1.4, max: model.isCompact ? 7 : 22, fixed: false };
    case 'DC':
      return { min: 2, max: 150, fixed: false };
  }
}

/** Tarifas aplicables al tipo de cargador: domiciliarias para BYD/Emergency, públicas para AC/DC */
export function tarifasDisponibles(chargerType: ChargerType): Tarifa[] {
  const domiciliaria = chargerType === 'BYD' || chargerType === 'EMERGENCY';
  return TARIFAS.filter((t) => t.domiciliaria === domiciliaria);
}

/** Shell aplica solo a carga pública de modelos con DC (§1.3) */
export function shellDisponible(model: CarModel, chargerType: ChargerType): boolean {
  return (chargerType === 'AC' || chargerType === 'DC') && model.maxDc > 0;
}
