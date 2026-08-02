import { describe, expect, it } from 'vitest';
import { CAR_MODELS, EFFICIENCY, chargerRange, shellDisponible } from '../data';
import { calculateCharge, effectiveChargerType, formatHours } from '../engine';
import { costoPorKm } from '../costoPorKm';
import type { CarModel } from '../types';

const byId = (id: string): CarModel => {
  const m = CAR_MODELS.find((m) => m.id === id);
  if (!m) throw new Error(`modelo ${id} no existe`);
  return m;
};

describe('validación con dato real (Dolphin Mini GS, AC 6.6 kW, 23→100%)', () => {
  // Carga real reportada: 14:39→20:27 (5h48m), 38.3 kWh de red
  const result = calculateCharge({
    model: byId('dolphin-mini-gs'),
    chargerType: 'AC',
    chargerPower: 6.6,
    currentBattery: 23,
    targetPercent: 100,
    tarifaId: 'YPF',
  });

  it('predice el tiempo real (5h48m) con tolerancia ±5%', () => {
    const realHoras = 5 + 48 / 60;
    expect(Math.abs(result.timeInHours - realHoras) / realHoras).toBeLessThan(0.05);
  });

  it('la energía de red implícita coincide con los 38.3 kWh medidos', () => {
    const energiaRed = result.targetEnergyKw / EFFICIENCY;
    expect(energiaRed).toBeGreaterThan(37.8);
    expect(energiaRed).toBeLessThan(38.8);
  });

  it('energía útil = 77% de 43.2 kWh', () => {
    expect(result.targetEnergyKw).toBeCloseTo(33.264, 3);
  });
});

describe('motor base (§2)', () => {
  it('usa target 80% por defecto', () => {
    const r = calculateCharge({
      model: byId('yuan-pro'),
      chargerType: 'AC',
      chargerPower: 6.6,
      currentBattery: 30,
      tarifaId: 'YPF',
    });
    expect(r.percentageToCharge).toBe(50);
    expect(r.targetEnergyKw).toBeCloseTo(0.5 * byId('yuan-pro').batteryKw, 5);
    expect(r.addedRangeKm).toBe(190);
  });

  it('limita la potencia al cargador embarcado (min(chargerPower, maxAc))', () => {
    const r = calculateCharge({
      model: byId('yuan-pro'),
      chargerType: 'AC',
      chargerPower: 22,
      currentBattery: 30,
      tarifaId: 'YPF',
    });
    expect(r.actualChargingPower).toBe(6.6);
  });

  it('EMERGENCY fuerza 1.4 kW aunque el slider diga otra cosa', () => {
    const r = calculateCharge({
      model: byId('yuan-pro'),
      chargerType: 'EMERGENCY',
      chargerPower: 22,
      currentBattery: 30,
      tarifaId: 'EPE',
    });
    expect(r.actualChargingPower).toBe(1.4);
  });

  it('costoSesion = kWh × tarifa', () => {
    const r = calculateCharge({
      model: byId('yuan-pro'),
      chargerType: 'AC',
      chargerPower: 6.6,
      currentBattery: 30,
      tarifaId: 'YPF',
    });
    expect(r.costoSesion).toBeCloseTo(0.5 * byId('yuan-pro').batteryKw * 892, 2);
  });

  it('batería actual >= target → sesión vacía, sin división por cero en $/km', () => {
    const r = calculateCharge({
      model: byId('yuan-pro'),
      chargerType: 'AC',
      chargerPower: 6.6,
      currentBattery: 90,
      tarifaId: 'YPF',
    });
    expect(r.percentageToCharge).toBe(0);
    expect(r.timeInHours).toBe(0);
    expect(costoPorKm({ costoSesion: r.costoSesion, addedRangeKm: r.addedRangeKm })).toBeNull();
  });
});

describe('curva de taper DC (§3.3)', () => {
  const model = byId('dolphin-mini-gs'); // maxDc 85

  it('marca esCurvaEstimada solo en DC', () => {
    const dc = calculateCharge({ model, chargerType: 'DC', chargerPower: 60, currentBattery: 20, tarifaId: 'YPF' });
    const ac = calculateCharge({ model, chargerType: 'AC', chargerPower: 6.6, currentBattery: 20, tarifaId: 'YPF' });
    expect(dc.esCurvaEstimada).toBe(true);
    expect(ac.esCurvaEstimada).toBe(false);
  });

  it('20→80 @ 60 kW: tramo1 (20→75) a plena + tramo2 (75→80) al 35%', () => {
    const r = calculateCharge({ model, chargerType: 'DC', chargerPower: 60, currentBattery: 20, tarifaId: 'YPF' });
    const e1 = (55 / 100) * 43.2;
    const e2 = (5 / 100) * 43.2;
    const esperado = e1 / 60 / EFFICIENCY + e2 / (60 * 0.35) / EFFICIENCY;
    expect(r.timeInHours).toBeCloseTo(esperado, 6);
  });

  it('currentBattery >= 75 → todo el tiempo cae en el tramo con taper', () => {
    const r = calculateCharge({
      model,
      chargerType: 'DC',
      chargerPower: 60,
      currentBattery: 80,
      targetPercent: 100,
      tarifaId: 'YPF',
    });
    const esperado = ((20 / 100) * 43.2) / (60 * 0.35) / EFFICIENCY;
    expect(r.timeInHours).toBeCloseTo(esperado, 6);
  });

  it('respeta maxDc del auto (Shark 40 kW con cargador de 150)', () => {
    const r = calculateCharge({
      model: byId('shark'),
      chargerType: 'DC',
      chargerPower: 150,
      currentBattery: 20,
      tarifaId: 'YPF',
    });
    expect(r.actualChargingPower).toBe(40);
  });
});

describe('reglas por modelo (§1)', () => {
  it('auto sin DC + cargador DC → se fuerza AC', () => {
    expect(effectiveChargerType(0, 'DC')).toBe('AC');
    const r = calculateCharge({
      model: byId('atto-2'),
      chargerType: 'DC',
      chargerPower: 60,
      currentBattery: 20,
      tarifaId: 'YPF',
    });
    expect(r.chargerType).toBe('AC');
    expect(r.esCurvaEstimada).toBe(false);
    expect(r.actualChargingPower).toBe(6.6);
  });

  it('isCompact en AC pública: tope 7 kW para atto-2, song-pro-* y seal-u-dmi; el resto 22 kW', () => {
    expect(chargerRange(byId('atto-2'), 'AC').max).toBe(7);
    expect(chargerRange(byId('song-pro-gl'), 'AC').max).toBe(7);
    expect(chargerRange(byId('song-pro-gs'), 'AC').max).toBe(7);
    expect(chargerRange(byId('seal-u-dmi'), 'AC').max).toBe(7);
    expect(chargerRange(byId('yuan-pro'), 'AC').max).toBe(22);
    expect(chargerRange(byId('shark'), 'AC').max).toBe(22);
  });

  it('Wallbox BYD domiciliario: tope 6,6 kW para todos los modelos', () => {
    expect(chargerRange(byId('yuan-pro'), 'BYD').max).toBe(6.6);
    expect(chargerRange(byId('shark'), 'BYD').max).toBe(6.6);
    expect(chargerRange(byId('atto-2'), 'BYD').max).toBe(6.6);
  });

  it('Seal U DM-i: misma ficha que Song Pro GS', () => {
    const seal = byId('seal-u-dmi');
    const song = byId('song-pro-gs');
    expect(seal.batteryKw).toBe(song.batteryKw);
    expect(seal.maxAc).toBe(song.maxAc);
    expect(seal.maxDc).toBe(0);
    expect(seal.electricRange).toBe(song.electricRange);
    expect(seal.tipo).toBe('PHEV');
  });

  it('Shell solo con maxDc > 0 y carga pública', () => {
    expect(shellDisponible(byId('atto-2'), 'DC')).toBe(false);
    expect(shellDisponible(byId('dolphin-mini-gs'), 'BYD')).toBe(false);
    expect(shellDisponible(byId('dolphin-mini-gs'), 'DC')).toBe(true);

    const conShell = calculateCharge({
      model: byId('dolphin-mini-gs'),
      chargerType: 'DC',
      chargerPower: 60,
      currentBattery: 20,
      tarifaId: 'YPF',
    });
    expect(conShell.costoShell).toBeCloseTo(conShell.timeInHours * 60 * 609, 6);

    const sinShell = calculateCharge({
      model: byId('atto-2'),
      chargerType: 'DC', // forzado a AC
      chargerPower: 60,
      currentBattery: 20,
      tarifaId: 'YPF',
    });
    expect(sinShell.costoShell).toBeNull();
  });
});

describe('costo por km (§4.1)', () => {
  it('con defaults: nafta $2300/l y 8,5 l/100km → $195,50/km', () => {
    const r = costoPorKm({ costoSesion: 20000, addedRangeKm: 190 });
    expect(r).not.toBeNull();
    expect(r!.costoPorKmNafta).toBeCloseTo(195.5, 2);
    expect(r!.costoPorKmElectrico).toBeCloseTo(20000 / 190, 5);
    expect(r!.ahorroPorKm).toBeCloseTo(195.5 - 20000 / 190, 5);
    expect(r!.ahorroPorcentual).toBeCloseTo(((195.5 - 20000 / 190) / 195.5) * 100, 5);
  });

  it('acepta precio de nafta y consumo custom', () => {
    const r = costoPorKm({ costoSesion: 10000, addedRangeKm: 100, precioNafta: 2000, consumoReferencia: 10 });
    expect(r!.costoPorKmNafta).toBe(200);
    expect(r!.costoPorKmElectrico).toBe(100);
    expect(r!.ahorroPorcentual).toBe(50);
  });
});

describe('formatHours', () => {
  it('formatea horas y minutos', () => {
    expect(formatHours(5.794)).toBe('5h 48m');
    expect(formatHours(0.5)).toBe('30m');
    expect(formatHours(2)).toBe('2h 00m');
  });
});
