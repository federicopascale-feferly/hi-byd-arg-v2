import { describe, expect, it } from 'vitest';
import { paybackWallbox } from '../payback';

describe('amortización del Wallbox (§4.5 adaptada, precios en USD)', () => {
  // Sesión de referencia: 25.92 kWh (Dolphin Mini GS 20→80)
  const targetEnergyKw = 25.92;

  it('caso default: cargador bonificado (USD 0) + instalación USD 500 a $1500', () => {
    const r = paybackWallbox({ targetEnergyKw });
    expect(r).not.toBeNull();
    expect(r!.costoTotalUsd).toBe(500);
    expect(r!.costoTotalArs).toBe(750_000);
    // EPE 350 vs YPF 892 → ahorro por sesión = 25.92 * 542
    expect(r!.ahorroPorSesion).toBeCloseTo(25.92 * 542, 2);
    expect(r!.cargasParaAmortizar).toBe(Math.ceil(750_000 / (25.92 * 542)));
  });

  it('cargador con costo: se suma a la instalación', () => {
    const r = paybackWallbox({
      targetEnergyKw,
      costoCargadorUsd: 800,
      costoInstalacionUsd: 400,
      tipoCambio: 1000,
    });
    expect(r!.costoTotalUsd).toBe(1200);
    expect(r!.costoTotalArs).toBe(1_200_000);
  });

  it('costo total 0 (todo bonificado) → amortización inmediata', () => {
    const r = paybackWallbox({ targetEnergyKw, costoCargadorUsd: 0, costoInstalacionUsd: 0 });
    expect(r!.cargasParaAmortizar).toBe(0);
  });

  it('acepta otras tarifas (EDELAP vs ChargeBox)', () => {
    const r = paybackWallbox({
      targetEnergyKw: 10,
      tarifaDomiciliariaId: 'EDELAP',
      tarifaPublicaId: 'CHARGEBOX',
    });
    expect(r!.ahorroPorSesion).toBeCloseTo(10 * (700 - 312), 2);
  });

  it('sesión vacía → null', () => {
    expect(paybackWallbox({ targetEnergyKw: 0 })).toBeNull();
  });
});
