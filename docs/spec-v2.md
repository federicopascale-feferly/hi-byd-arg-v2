# Spec funcional — Calculadora Hi BYD Argentina v2

> Spec original provista por Federico (julio 2026). Fuente de verdad del negocio.
> Estado de implementación: ver [CHANGELOG.md](./CHANGELOG.md).

Alcance: exclusivamente lógica de negocio (datos, fórmulas, inputs/outputs). No incluye UI/UX ni estilos — ya resueltos por otra vía.

---

## 1. Modelo de datos base

### 1.1 Vehículos (`CAR_MODELS`)

| id | Modelo | Tipo | Batería (kWh) | Max AC (kW) | Max DC (kW) | Autonomía eléctrica (km) |
|---|---|---|---|---|---|---|
| atto-2 | ATTO 2 | PHEV | 18.3 | 6.6 | 0 | 110 |
| yuan-pro | Yuan Pro | EV | 45.1 | 6.6 | 65 | 380 |
| dolphin-mini-gl | Dolphin Mini GL | EV | 30.08 | 6.6 | 65 | 300 |
| dolphin-mini-gs | Dolphin Mini GS | EV | 43.2 | 6.6 | 85 | 400 |
| shark | Shark | PHEV | 29.58 | 6.6 | 40 | 100 |
| song-pro-gl | Song Pro GL | PHEV | 12.9 | 6.6 | 0 | 71 |
| song-pro-gs | Song Pro GS | PHEV | 18.3 | 6.6 | 0 | 110 |

`isCompact` (potencia AC/Wallbox tope 7kW en vez de 22kW) = true para `atto-2` y modelos que empiezan con `song-pro`.

### 1.2 Tipos de cargador (`chargerType`)

| Tipo | Potencia | Rango slider | Notas |
|---|---|---|---|
| EMERGENCY | Fijo 1.4 kW | — | Tomacorriente estándar |
| BYD | Wallbox domiciliario | 1.4 – 7/22 kW (según `isCompact`) | Tope según modelo |
| AC | Pública alterna | 1.4 – 7/22 kW (según `isCompact`) | Tope según modelo |
| DC | Pública rápida | 2 – 150 kW | Solo si `maxDc > 0` |

Regla: si el auto no soporta DC (`maxDc === 0`) y `chargerType === 'DC'`, forzar `chargerType = 'AC'`.

### 1.3 Tarifas vigentes (ARS/kWh, ARS/min)

| Fuente | Tarifa | Aplica cuando |
|---|---|---|
| EPE Santa Fe | $350/kWh | Carga domiciliaria (BYD, Emergency) |
| EDELAP | $312/kWh | Carga domiciliaria (BYD, Emergency) |
| YPF | $892/kWh | Carga pública (AC, DC) |
| ChargeBox | $700/kWh | Carga pública (AC, DC) |
| Shell | $609/min | Carga pública, solo si el modelo tiene `maxDc > 0` (no aplica a `isCompact`) |

---

## 2. Motor de cálculo actual (base, sin cambios de fórmula)

```
percentageToCharge = targetPercent - currentBattery      // targetPercent hoy fijo en 80
targetEnergyKw      = (percentageToCharge / 100) * batteryKw
addedRangeKm         = round((percentageToCharge / 100) * electricRange)
maxCarPower          = (chargerType in [AC, EMERGENCY, BYD]) ? maxAc : maxDc
actualChargingPower  = min(chargerPower, maxCarPower)
timeInHours          = (targetEnergyKw / actualChargingPower) / efficiency
```

Costos:

```
costoSesion = targetEnergyKw * tarifa[fuenteSeleccionada]      // EPE / EDELAP / YPF / ChargeBox
costoShell  = (timeInHours * 60) * 609                          // tarifa por minuto
```

---

## 3. Correcciones al motor (validadas con dato real)

Fuente del dato: carga real reportada por un seguidor — Dolphin Mini GS, AC, 23%→100%, 14:39→20:27, 38.3 kWh consumidos de red.

### 3.1 Eficiencia

```
efficiency = 0.87   // antes: 0.90
```

Cálculo del dato real: 33.26 kWh útiles (77% de 43.2 kWh) / 38.3 kWh de red = 87%.

### 3.2 AC / BYD / Emergency: sin cambios

Confirmado con el mismo dato: en estos modos el techo de potencia es el cargador embarcado, se mantiene constante durante toda la sesión.

### 3.3 DC: curva de taper por tramos

No hay curva publicada por BYD. Referencia de industria para química LFP (Blade Battery): modelo "Flat LFP" — taper arranca en 75% SoC, cae a ~35% de potencia pico hasta 100%.

Reemplaza el cálculo de `timeInHours` **solo cuando `chargerType === 'DC'`**:

```
tramo1Pct = min(targetPercent, 75) - min(currentBattery, 75)   // tramo a potencia plena
tramo2Pct = max(targetPercent - 75, 0) - max(currentBattery - 75, 0)  // tramo con taper

energiaTramo1 = (tramo1Pct / 100) * batteryKw
energiaTramo2 = (tramo2Pct / 100) * batteryKw

tiempoTramo1 = (energiaTramo1 / actualChargingPower) / efficiency
tiempoTramo2 = (energiaTramo2 / (actualChargingPower * 0.35)) / efficiency

timeInHours = tiempoTramo1 + tiempoTramo2
```

Si `currentBattery >= 75`, `tramo1Pct = 0` y todo el cálculo cae en `tiempoTramo2`.

Flag a exponer junto al resultado: `esCurvaEstimada = true` cuando `chargerType === 'DC'`.

**Pendiente:** reemplazar 75%/35% por curva propia en cuanto haya captura real de carga DC (% + horario cada 5-10 min entre 70-100%) de la comunidad.

---

## 4. Funciones nuevas

### 4.1 Costo por km

**Inputs:** `precioNafta` (ARS/litro, default 1450), `consumoReferencia` (l/100km, default 8.5)

```
costoPorKmElectrico = costoSesion / addedRangeKm
costoPorKmNafta      = (precioNafta * consumoReferencia) / 100
ahorroPorKm           = costoPorKmNafta - costoPorKmElectrico
ahorroPorcentual       = (ahorroPorKm / costoPorKmNafta) * 100
```

Nota: para PHEV (atto-2, shark, song-pro-*) esto solo es válido para el tramo recorrido en modo 100% eléctrico.

### 4.2 Ahorro mensual proyectado

**Inputs:** `kmPorMes` (default 1200), `fuenteHabitual` (EPE | EDELAP | público)

```
sesionesPorMes        = kmPorMes / addedRangeKm
costoMensualElectrico = sesionesPorMes * costoSesion
costoMensualNafta      = (kmPorMes / 100) * consumoReferencia * precioNafta
ahorroMensual           = costoMensualNafta - costoMensualElectrico
ahorroAnual             = ahorroMensual * 12
```

### 4.3 Autonomía real vs homologada

**Input:** `modoAutonomia` (NEDC | real), default NEDC

```
factorCorreccion  = 0.78   // aproximación, sin dato propio todavía
addedRangeKmReal   = addedRangeKm * factorCorreccion   // solo si modoAutonomia === 'real'
```

No afecta `timeInHours` ni costos. Solo transforma el output de km mostrado.

### 4.4 Objetivo de carga configurable

**Input:** `targetPercent` (80 | 100), default 80

Reemplaza el valor fijo de la sección 2. Se combina directamente con la curva de taper DC (3.3).

### 4.5 Payback del Wallbox BYD

**Inputs:** `costoWallbox` (ARS, editable), reutiliza `sesionesPorMes` de 4.2

```
costoPorSesionWallbox  = targetEnergyKw * 350   // tarifa EPE
costoPorSesionPublico  = targetEnergyKw * 892   // tarifa YPF
ahorroPorSesion         = costoPorSesionPublico - costoPorSesionWallbox
sesionesParaPayback      = costoWallbox / ahorroPorSesion
mesesParaPayback          = sesionesParaPayback / sesionesPorMes
```

### 4.6 Función V2L (Vehicle-to-Load)

**Contexto confirmado:** ATTO 2 DM-i, Shark y Seal U DM-i traen V2L de fábrica en Argentina. Yuan Pro, Dolphin Mini y Song Pro: sin confirmar.

**Inputs:** modelo (subconjunto con V2L confirmado), `porcentajeBateriaDisponible`, `potenciaDispositivoW` (presets: heladera 60W, notebook 65W, luces LED 20W, pava 1500W, parrilla 2000W, o libre)

```
margenSeguridad = 0.9

energiaDisponibleKw       = (porcentajeBateriaDisponible / 100) * batteryKw * margenSeguridad
autonomiaDispositivoHoras = (energiaDisponibleKw * 1000) / potenciaDispositivoW
```

**Límite:** V2L de BYD entrega hasta 3.3 kW típico (a confirmar por modelo). Si `potenciaDispositivoW > potenciaMaximaV2L`, marcar como incompatible.

### 4.7 Tarjeta para compartir

Capa de salida (imagen/canvas) que consume resultados ya calculados: modelo, tiempo, costo, $/km, ahorro mensual (si 4.2 está implementado).

---

## 5. Orden sugerido de implementación

1. Corrección de eficiencia a 87% (3.1) ✅
2. Costo por km (4.1) ✅
3. V2L (4.6)
4. Ahorro mensual (4.2)
5. Payback Wallbox (4.5)
6. Objetivo de carga 80/100 (4.4)
7. Curva de taper DC (3.3) ✅ (implementada en Fase 1 con target fijo 80)
8. Autonomía real vs homologada (4.3)
9. Tarjeta para compartir (4.7)

## 6. Pendiente de datos reales

- [ ] Captura de carga DC pública (% + horario cada 5-10 min, 70-100%) para calibrar 3.3 con curva propia
- [ ] Confirmar V2L de fábrica en Yuan Pro, Dolphin Mini y Song Pro para ampliar 4.6
