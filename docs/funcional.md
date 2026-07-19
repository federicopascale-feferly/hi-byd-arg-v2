# Documentación funcional — Calculadora Hi BYD Argentina v2

**URL:** https://hi-byd-arg-v2.vercel.app
**Última actualización:** 2026-07-18 (Fase 2.4)

## 1. Propósito

Herramienta de la comunidad **Hi BYD Argentina** para que dueños e interesados en vehículos BYD calculen, con datos locales:

- Cuánto **tarda** una carga según modelo, batería actual, tipo de cargador y objetivo.
- Cuánto **cuesta** esa carga según la tarifa eléctrica elegida.
- Cuánto **ahorran por km** contra un auto naftero.
- En cuántas cargas se **amortiza** instalar un Wallbox domiciliario.

No requiere registro ni datos personales. Todo el cálculo ocurre en el navegador; solo el asistente de consultas llama a un servicio externo.

## 2. Catálogo de modelos

| Modelo | Tipo | Batería (kWh) | Max AC (kW) | Max DC (kW) | Autonomía eléctrica (km) | Tope AC pública |
|---|---|---|---|---|---|---|
| ATTO 2 | PHEV | 18,3 | 6,6 | — | 110 | 7 kW |
| Yuan Pro | EV | 45,1 | 6,6 | 65 | 380 | 22 kW |
| Dolphin Mini GL | EV | 30,08 | 6,6 | 65 | 300 | 22 kW |
| Dolphin Mini GS | EV | 43,2 | 6,6 | 85 | 400 | 22 kW |
| Shark | PHEV | 29,58 | 6,6 | 40 | 100 | 22 kW |
| Song Pro GL | PHEV | 12,9 | 6,6 | — | 71 | 7 kW |
| Song Pro GS | PHEV | 18,3 | 6,6 | — | 110 | 7 kW |
| Seal U DM-i | PHEV | 18,3 | 6,6 | — | 110 | 7 kW |

Cada modelo tiene una **descripción breve** que se muestra al seleccionarlo. El selector arranca colapsado (un modelo elegido + botón "Cambiar modelo"); al expandir se ve la grilla completa bajo el título **"Modelos disponibles en Argentina"**.

## 3. Flujo principal de la calculadora

### 3.1 Batería actual
Slider 0–100% con cursor 🔋 e **hitos al 20% y 80%** que marcan la zona saludable de la batería. La barra pinta:
- **Violeta**: carga actual.
- **Naranja**: la zona que se va a cargar (de la batería actual al objetivo).
- **Gris**: el resto.

Aviso permanente: *en carga rápida DC conviene cortar en 80% (después la velocidad baja); en AC la velocidad se mantiene hasta el final* — verificado en campo por la comunidad (ATTO 2 en AC pública, Dolphin Mini GS en AC).

### 3.2 Objetivo de carga
Toggle **"80% recomendado" / "100%"** (default 80%). El resultado siempre explicita el rango ("20% → 80%"). Al elegir 100% **con DC** aparece el aviso de que el último tramo es más lento.

### 3.3 Tipo de carga

| Tipo | Potencia | Tarifas aplicables |
|---|---|---|
| Tomacorriente | 1,4 kW fijo | EPE / EDELAP (domiciliarias) |
| Wallbox BYD | 1,4–6,6 kW (con aclaración: más potencia es raro en Argentina) | EPE / EDELAP |
| Pública AC | 1,4–7 o 22 kW según modelo | YPF / ChargeBox |
| Rápida DC | 2–150 kW | YPF / ChargeBox (+ costo Shell por minuto) |

Reglas:
- Si el modelo no soporta DC, el botón se deshabilita y se aclara que se calcula como AC.
- La potencia efectiva es el mínimo entre el cargador y el máximo del auto; si el auto limita, se avisa ("El auto limita la carga a 6,6 kW").
- Con carga pública (AC/DC) aparece el botón **"Encontrá tu punto de carga más cercano"**, que abre Google Maps con la búsqueda de estaciones de carga cerca de la ubicación del dispositivo (sin API key, la geolocalización la resuelve Maps).

### 3.4 Tarifas vigentes (referencia julio 2026)

| Fuente | Precio | Tipo |
|---|---|---|
| EPE Santa Fe | $350/kWh | Domiciliaria |
| EDELAP | $312/kWh | Domiciliaria |
| YPF | $892/kWh | Pública |
| ChargeBox | $700/kWh | Pública |
| Shell Recharge | $609/minuto | Pública, solo modelos con DC |

### 3.5 Comparación con nafta
Inputs: precio de nafta (default **$2.300/litro**) y consumo de referencia con **unidad seleccionable**: l/100 km (default 8,5) o km/litro (conversión automática al cambiar la unidad).

## 4. Resultados

- **Tiempo de carga estimado** (grande, formato "4h 31m") con el detalle "modelo · X% → objetivo% · potencia".
- **Energía a cargar** (kWh), **autonomía agregada** (km), **costo de la sesión** con la tarifa elegida, **costo Shell** (si aplica) o potencia efectiva.
- **Costo por km**: barras comparativas eléctrico (verde) vs nafta (gris), ahorro por km en $ y %. Si el eléctrico sale más caro (p. ej. PHEV chico en pública cara), se muestra "más caro" con el porcentaje.
- Avisos contextuales:
  - **"Curva DC estimada (taper desde 75%), no es dato de fábrica"** cuando el cálculo usa la curva DC.
  - **Nota PHEV**: el costo por km vale solo para tramos en modo 100% eléctrico.
  - **Batería ≥ objetivo**: "No hace falta cargar".

## 5. Amortización del Wallbox

Sección independiente al pie. Inputs **en USD**: costo del cargador (default **US$ 0** — "Bonificado por BYD con el 0km", editable), costo de instalación (default US$ 500) y tipo de cambio (default $1.500, editable). Se eligen la tarifa domiciliaria y la carga pública que se evita.

Salidas: inversión total (USD y ARS), ahorro por carga en casa, comparación por carga (casa vs. pública) y **cantidad de cargas para amortizar** la inversión (usa la misma sesión configurada arriba). Si la inversión es $0: "amortización inmediata".

## 6. Asistente de consultas (IA)

Chat flotante (botón abajo a la derecha). Responde en español rioplatense, solo sobre vehículos BYD, carga, costos y uso de la calculadora, usando **los mismos datos y fórmulas de la app** (se le inyectan automáticamente: catálogo, tarifas, eficiencia, curva DC, reglas). Puede hacer estimaciones ("¿cuánto tarda un Shark en Wallbox?").

Comportamiento ante fallas: si el servicio no está configurado o no responde, muestra mensajes amigables y el resto de la app sigue funcionando.

### QA externo del asistente

Para testear la calidad de las respuestas con **ArtificialQA** existe el endpoint `POST /api/agente-test`: recibe el mismo historial que el chat pero en formato OpenAI, protegido con un token propio (`AGENTE_TEST_TOKEN`, header `Authorization: Bearer`). Usa exactamente el mismo núcleo que la burbuja (mismos datos, mismo modelo, mismo prompt), así que lo que apruebe el QA es lo que ve el usuario. Solo lectura.

## 7. Motor de cálculo (reglas de negocio)

```
percentageToCharge  = targetPercent − currentBattery        (targetPercent: 80 u 100)
targetEnergyKw      = (percentageToCharge / 100) × batteryKw
addedRangeKm        = round((percentageToCharge / 100) × electricRange)
actualChargingPower = min(potencia del cargador, máximo del auto)   (AC: 6,6 kW embarcado; DC: según modelo)
efficiency          = 0,87   (validada con carga real)

AC / Wallbox / Tomacorriente (potencia constante):
  timeInHours = targetEnergyKw / actualChargingPower / efficiency

DC (curva de taper por tramos — estimada para química LFP Blade):
  hasta 75% de batería → potencia plena
  desde 75%            → 35% de la potencia
  (por eso cargar 80→100 en DC tarda desproporcionadamente más)

costoSesion  = targetEnergyKw × tarifa
costoShell   = minutos × $609
costoPorKm   = costoSesion / addedRangeKm    vs    nafta = precio × consumo / 100
amortización = (cargadorUSD + instalaciónUSD) × tipoCambio / ahorroPorSesion   (redondeo hacia arriba)
```

### Validaciones con datos reales de la comunidad

| Dato | Fuente | Resultado del modelo |
|---|---|---|
| Dolphin Mini GS, AC 6,6 kW, 23→100%, 5h48m reales, 38,3 kWh de red | Seguidor de la comunidad | 5h48m y 38,2 kWh — coincide |
| ATTO 2 en AC pública: la velocidad NO baja después del 80% | Federico (2026-07-18) | El motor ya calculaba AC constante; se ajustaron los textos |

**Pendiente de datos**: curva DC real (captura de % + horario cada 5-10 min entre 70 y 100%) para reemplazar la aproximación 75%/35%.

## 8. Alcance pendiente (spec §4, por fases)

1. V2L — autonomía de dispositivos enchufados al auto (§4.6)
2. Ahorro mensual proyectado (§4.2)
3. Autonomía real vs homologada (§4.3)
4. Tarjeta para compartir en redes (§4.7)

La spec funcional original está en [spec-v2.md](./spec-v2.md); el detalle de cada entrega en [CHANGELOG.md](./CHANGELOG.md).
