# Changelog — Calculadora Hi BYD Argentina v2

## Fase 1 — 2026-07-17

Primera versión funcional, deployada en Vercel.

### Implementado

**Motor de cálculo** (`src/lib/calc/`) — spec §1, §2, §3:
- `data.ts`: 7 modelos BYD, tarifas (EPE $350, EDELAP $312, YPF $892, ChargeBox $700, Shell $609/min), rangos de cargador con tope `isCompact` (7 kW para ATTO 2 y Song Pro), regla Shell solo con `maxDc > 0`.
- `engine.ts`: motor base con **eficiencia 0.87** (§3.1, validada contra carga real) y **curva de taper DC por tramos** (§3.3: potencia plena hasta 75% SoC, 35% del pico de ahí en más) con flag `esCurvaEstimada`. Regla DC→AC forzado para autos sin DC. `targetPercent` parametrizado internamente (fijo en 80 en la UI, preparado para §4.4).
- `costoPorKm.ts`: §4.1 completa (defaults: nafta $1450/l, 8.5 l/100km).

**Tests** (`src/lib/calc/__tests__/engine.test.ts`) — 18 tests Vitest:
- Gate de validación con el dato real (Dolphin Mini GS, AC, 23→100%): el modelo predice 5h48m contra 5h48m reales y 38,2 kWh de red contra 38,3 medidos.
- Bordes: batería ≥ 75% en DC, DC forzado a AC, topes de potencia, disponibilidad Shell, sesión vacía.

**UI** (`src/app/`, `src/components/`):
- Next.js 16 + Tailwind 4, página única en es-AR, 100% estática (sin backend).
- Sistema de diseño generado con la skill **ui-ux-pro-max**: estilo Aurora UI, paleta cian eléctrico + verde eco, tipografías Syncopate/Space Mono. Persistido en `design-system/hi-byd-arg/MASTER.md`.
- Modo claro/oscuro automático, responsive (mobile-first), accesible (fieldsets, aria-pressed, focus visible, touch targets 44px, prefers-reduced-motion).
- Aviso de curva DC estimada, nota PHEV para costo por km, aviso de potencia limitada por el cargador embarcado.

### Decisiones técnicas

- El proyecto vive en `~/Hi BYD ARG v2` con package name `hi-byd-arg-v2`.
- Deploy directo con Vercel CLI; conexión GitHub pendiente (requiere `gh auth login`).
- Nota: la spec §3.1 menciona que el modelo predice "5h36m" para el dato real; el cálculo correcto con eficiencia 0.87 da 5h48m, que coincide exactamente con la carga real medida. Se dejó el motor tal cual la fórmula de la spec.

### Pendiente (fases siguientes, en orden sugerido)

1. V2L (§4.6)
2. Ahorro mensual proyectado (§4.2)
3. Payback Wallbox (§4.5)
4. Objetivo de carga 80/100 (§4.4) — el motor ya lo soporta, falta UI
5. Autonomía real vs homologada (§4.3)
6. Tarjeta para compartir (§4.7)
7. Conexión GitHub → Vercel
8. Calibrar curva DC con datos reales de la comunidad
