export type VehicleKind = 'EV' | 'PHEV';

export type ChargerType = 'EMERGENCY' | 'BYD' | 'AC' | 'DC';

export type TarifaId = 'EPE' | 'EDELAP' | 'YPF' | 'CHARGEBOX';

export interface CarModel {
  id: string;
  nombre: string;
  tipo: VehicleKind;
  /** Descripción breve para mostrar al seleccionar el modelo */
  descripcion: string;
  /** Capacidad de batería en kWh */
  batteryKw: number;
  /** Potencia máxima de carga AC en kW */
  maxAc: number;
  /** Potencia máxima de carga DC en kW (0 = no soporta DC) */
  maxDc: number;
  /** Autonomía eléctrica en km */
  electricRange: number;
  /** Tope de potencia AC/Wallbox 7 kW en vez de 22 kW */
  isCompact: boolean;
}

export interface Tarifa {
  id: TarifaId;
  nombre: string;
  /** ARS por kWh */
  precioKwh: number;
  /** true = carga domiciliaria (BYD, Emergency); false = pública (AC, DC) */
  domiciliaria: boolean;
}

export interface ChargeInput {
  model: CarModel;
  chargerType: ChargerType;
  /** Potencia del cargador en kW (ignorada para EMERGENCY, que es fija 1.4) */
  chargerPower: number;
  /** % de batería actual (0–100) */
  currentBattery: number;
  /** % objetivo de carga (fijo en 80 en Fase 1) */
  targetPercent?: number;
  /** Tarifa por kWh seleccionada */
  tarifaId: TarifaId;
}

export interface ChargeResult {
  /** Tipo de cargador efectivo (DC se fuerza a AC si el auto no soporta DC) */
  chargerType: ChargerType;
  percentageToCharge: number;
  /** Energía a cargar en kWh (útil, en batería) */
  targetEnergyKw: number;
  /** Autonomía agregada en km */
  addedRangeKm: number;
  /** Potencia efectiva de carga en kW */
  actualChargingPower: number;
  timeInHours: number;
  /** Costo de la sesión con la tarifa seleccionada (ARS) */
  costoSesion: number;
  /** Costo en Shell por minuto (ARS); null si el modelo no accede a Shell */
  costoShell: number | null;
  /** true cuando el tiempo DC sale de la curva de taper estimada, no de dato de fábrica */
  esCurvaEstimada: boolean;
}

export interface CostoPorKmInput {
  costoSesion: number;
  addedRangeKm: number;
  /** ARS por litro */
  precioNafta?: number;
  /** Litros cada 100 km */
  consumoReferencia?: number;
}

export interface CostoPorKmResult {
  costoPorKmElectrico: number;
  costoPorKmNafta: number;
  ahorroPorKm: number;
  ahorroPorcentual: number;
}
