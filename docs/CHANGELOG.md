# Changelog — Calculadora Hi BYD Argentina v2

## Fase 2.7 — 2026-07-20 (Android APK via GitHub Actions)

- **Capacitor** agregado para empaquetar la app como APK Android
- **GitHub Actions workflow** (`build-apk.yml`): 
  - Auto-buildea APK en cada push a `main`
  - Genera APK debug (testing) + release (Play Store)
  - Tests corren antes del build
  - Artifacts disponibles para descargar
- **Next.js configurado** para static export (`output: export`, `distDir: out`)
- Documentación: `.github/workflows/README.md` con instrucciones para firma + Play Store

## Fase 2.6 — 2026-07-19 (Nuevas tarifas)

- **EPEC ($183.78/kWh)** agregada como tarifa domiciliaria (Corrientes).
- **COMBO personalizado** — nueva tarifa pública con precio editable (default $500/kWh):
  - Input de edición en tiempo real debajo del selector cuando se selecciona COMBO
  - El motor calcula el costo con el precio ingresado por el usuario
  - Permite comparar costos con diferentes tarifas sin añadir opciones predefinidas

## Fase 2.5 — 2026-07-19

- **Endpoint de QA externo `/api/agente-test`** para que ArtificialQA teste el asistente: protegido con `AGENTE_TEST_TOKEN` (Bearer, tolerante a prefijo/espacios/mayúsculas), habla formato OpenAI (`messages[]` → `choices[0].message.content`), solo lectura. Mismo patrón que en artificialqa-outreach.
- El núcleo del asistente se extrajo a `src/lib/chat/asistente.ts` (sanitización + llamada a Claude), compartido por `/api/chat` y `/api/agente-test`. Nuevos tests de `sanitizeMessages` (29 en total) + `vitest.config.ts` con el alias `@/`.
- Documentación completa creada: [funcional.md](./funcional.md) y [tecnica.md](./tecnica.md); README reescrito como punto de entrada.
- **Suite de QA en ArtificialQA** (conexión "Asistente Hi BYD"): 10 casos (exactitud de tiempo y costo, datos de modelos/tarifas, reglas DC 80% vs AC constante, honestidad, fuera de alcance, prompt injection, ambigüedad) × 8 evaluadores. **3 runs completadas: Run #1 score 0.974, Run #2 score 0.978, Run #3 (baseline) score 0.990 — 10/10 aprobados en todas las dimensiones**, todos los evaluadores al 100%. Hallazgo de la QA (observación de producto, no bug): el costo de sesión se calcula con energía a la batería (engine.ts:53), sin aplicar la eficiencia 0,87 al costo — subestima ~13% el costo real de red (uno paga energía de red, no de batería). El tiempo sí usa 0.87 (correcto). El agente está alineado con la app ($58/km, no $67/km). **Decisión pendiente de Fede:** ¿el costo debería usar energía de red (battery/0.87)? Si se cambia, tocar engine.ts + tests + system prompt + test QA.
- **MCP ArtificialQA conectado** en Claude Code tras renovar OAuth tokens (`npx -y mcp-remote`).
- **Token `AGENTE_TEST_TOKEN`** generado localmente (32 bytes hex), cargado en `.env.local` y en Vercel Production (Sensitive).
- **Auth tolerante en `/api/agente-test`** tras 401 inicial: acepta el token con o sin prefijo "Bearer", trim de espacios, case-insensitive.

## Fase 2.4 — 2026-07-18

- **La barra de batería refleja el objetivo de carga**: al elegir 80% o 100%, la zona a cargar (batería actual → objetivo) se pinta en naranja sobre el track (`EmojiRange.highlightTo`), y el hito del objetivo se mueve — con 100% aparecen los hitos 80% y 100%.

## Fase 2.3 — 2026-07-18

- **Dato de campo (Federico, ATTO 2 en AC pública): la velocidad NO baja después del 80% en AC.** El motor ya lo calculaba así (taper solo en DC, §3.2/§3.3) — se corrigieron los **textos** que generalizaban a "cargas públicas": la recomendación de cortar en 80% ahora se ata explícitamente a la carga rápida DC, y se aclara que en AC la velocidad se mantiene hasta el final. El aviso al elegir objetivo 100% ahora aparece solo con DC. El system prompt del chat incorpora la verificación de la comunidad.

## Fase 2.2 — 2026-07-18

- **Objetivo de carga configurable 80/100 (spec §4.4)**: toggle "Objetivo de carga: 80% recomendado / 100%" debajo del slider de batería. El resultado muestra explícitamente el objetivo ("20% → 80%" o "→ 100%"). Al elegir 100% aparece el aviso de que el último tramo es más lento (en DC aplica la curva de taper 80→100 que ya estaba en el motor). La amortización del Wallbox usa la misma sesión configurada.

## Fase 2.1 — 2026-07-18

- **Seal U DM-i** agregado al catálogo (ficha igual a Song Pro GS: 18,3 kWh, AC 6,6 kW, sin DC, 110 km eléctricos; PHEV con V2L). El chat lo conoce automáticamente (system prompt generado desde `data.ts`).
- Título del selector: **"Modelos disponibles en Argentina"**. Al elegir un modelo la grilla se colapsa y queda solo el seleccionado con una **descripción breve** (campo `descripcion` en `CarModel`) y botón "Cambiar modelo".
- **Slider de batería con hitos al 20% y 80%** (cortes visuales sobre la barra) + aviso: en cargas públicas conviene cargar hasta el 80% porque después la velocidad baja.
- **Wallbox BYD limitado a 6,6 kW** (`BYD_WALLBOX_MAX`) con aclaración de que instalaciones de más potencia son raras. La AC pública mantiene 7/22 kW según `isCompact`.
- **Emojis como thumb de los sliders**: 🔋 batería, ⚡ potencia (componente `EmojiRange`: input transparente con área táctil de 44px + track y emoji dibujados aparte).
- **Botón "Encontrá tu punto de carga más cercano"** (visible con carga pública AC/DC): abre Google Maps con la búsqueda de estaciones de carga cerca de la ubicación del usuario — sin API key ni costo. Si se valida el uso, se puede evolucionar a mapa embebido con Places API.
- Tests: 25 (nuevos: tope Wallbox 6,6 y ficha Seal U DM-i).


## Fase 2 — 2026-07-18

### Design system propio
- Se reemplazó el estilo Aurora (cian/verde) por el **"Hi BYD Argentina Design System"** de claude.ai/design: modo oscuro único (fondo #1A1A1A), violeta `#8812F9` + naranja `#FF8B00`, neutros plata, tipografía **Ubuntu / Ubuntu Mono**. Tokens en `src/app/globals.css`; verde `#4ADE80` (--success del DS) reservado para ahorro/eléctrico.

### Comparación con nafta
- Precio de nafta default: **$2.300/litro** (antes $1.450).
- Consumo con unidad configurable: **l/100 km ↔ km/litro** (toggle con conversión automática; el motor sigue calculando en l/100 km).

### Amortización del Wallbox (§4.5 adaptada)
- Nueva sección `PaybackSection` + módulo `src/lib/calc/payback.ts` (5 tests nuevos, 23 en total).
- Inputs **en USD**: costo del cargador (default 0 — bonificado por BYD con el 0km, editable) + instalación (default US$ 500) + tipo de cambio editable (default $1.500, oficial jul-2026).
- Salida: inversión total (USD y ARS), ahorro por carga (tarifa domiciliaria vs. pública, seleccionables) y **cantidad de cargas para amortizar**; caso "amortización inmediata" cuando todo es bonificado.

### Asistente de consultas con IA
- Widget de chat flotante (`ChatWidget`) + route handler `src/app/api/chat/route.ts` con `@anthropic-ai/sdk` (modelo `claude-opus-4-8`, thinking adaptativo, effort low, prompt caching).
- System prompt generado desde los datos reales de la calculadora (`src/lib/chat/systemPrompt.ts`): modelos, tarifas y fórmulas — responde solo sobre BYD/carga, en español.
- **Requiere `ANTHROPIC_API_KEY` en Vercel** (ver `.env.example`). Sin la key, el chat degrada con un mensaje amigable y el resto de la app funciona normal. La app dejó de ser 100% estática: `/api/chat` es una función serverless.


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
