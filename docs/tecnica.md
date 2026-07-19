# Documentación técnica — Calculadora Hi BYD Argentina v2

**Producción:** https://hi-byd-arg-v2.vercel.app · **Última actualización:** 2026-07-19 (Fase 2.5)

## 1. Stack

| Pieza | Versión / detalle |
|---|---|
| Next.js | 16.2.10 (App Router, Turbopack, `src/`) — ⚠️ tiene breaking changes vs. versiones previas; ante la duda, leer `node_modules/next/dist/docs/` (ver `AGENTS.md`) |
| React | 19.2 |
| Tailwind CSS | 4 (tokens vía `@theme inline` en `globals.css`, sin `tailwind.config`) |
| TypeScript | strict |
| Vitest | 4 — 29 tests (`npm test`); alias `@/` resuelto en `vitest.config.ts` |
| @anthropic-ai/sdk | ^0.112 — asistente con `claude-opus-4-8` |
| Deploy | Vercel CLI (proyecto `hi-byd-arg-v2`, cuenta `federicopascale-9561`) |

La app es estática (una sola página prerenderizada) salvo dos funciones serverless: `/api/chat` y `/api/agente-test`.

## 2. Estructura

```
src/
├── lib/
│   ├── calc/                  # lógica de negocio pura (sin React)
│   │   ├── types.ts           # CarModel, ChargerType, Tarifa, ChargeInput/Result
│   │   ├── data.ts            # 8 modelos, tarifas, constantes y rangos de cargador
│   │   ├── engine.ts          # calculateCharge: tiempo/energía/costos, taper DC
│   │   ├── costoPorKm.ts      # §4.1: $/km eléctrico vs nafta
│   │   ├── payback.ts         # amortización del Wallbox (USD → ARS → cargas)
│   │   └── __tests__/         # 25 tests (engine + payback)
│   ├── chat/
│   │   ├── systemPrompt.ts    # prompt del asistente GENERADO desde data.ts
│   │   ├── asistente.ts       # núcleo compartido: sanitización + llamada a Claude
│   │   └── __tests__/         # 4 tests (sanitizeMessages)
│   └── format.ts              # números/moneda es-AR
├── app/
│   ├── page.tsx / layout.tsx  # página única, fuentes Ubuntu vía next/font
│   ├── globals.css            # tokens del design system + CSS de .emoji-range
│   └── api/
│       ├── chat/route.ts        # burbuja de la web
│       └── agente-test/route.ts # QA externo (ArtificialQA)
└── components/                # Calculator (estado central) + presentacionales
```

## 3. Motor de cálculo (`src/lib/calc/`)

Invariantes que NO hay que romper (están testeadas):

- **Eficiencia de carga 0,87**: energía de red = energía a batería / 0,87. Validada contra una carga real de la comunidad (Dolphin Mini GS, AC 6,6 kW, 23→100%: el modelo da 5h48m / 38,2 kWh vs. 5h48m / 38,3 kWh medidos). Ese caso es el **gate** de la suite: si un cambio lo rompe, el cambio está mal.
- **Curva DC por tramos** (`DC_TAPER_START = 75`, `DC_TAPER_FACTOR = 0.35`): potencia plena hasta 75% de SoC, 35% del pico de ahí en más; `esCurvaEstimada = true` (aproximación para química LFP Blade, pendiente de calibrar con datos reales). **AC es constante hasta el 100%** — verificado en campo (ATTO 2 en AC pública).
- **Potencia efectiva** = `min(potencia del cargador, máximo del auto)`; AC embarcado 6,6 kW en todos los modelos, DC según ficha. Si el modelo no tiene DC (`maxDc === 0`), `effectiveChargerType` fuerza DC→AC.
- **Rangos de cargador** (`chargerRange`): tomacorriente fijo 1,4 · Wallbox BYD 1,4–6,6 (`BYD_WALLBOX_MAX`) · AC pública 1,4–7 o 22 según `isCompact` · DC 2–150.
- `targetPercent` ∈ {80, 100} (`DEFAULT_TARGET_PERCENT = 80`). Shell ($/minuto) solo disponible con DC real.

Los modelos nuevos se agregan **solo en `data.ts`** (con `descripcion`): la UI, el selector y el system prompt del chat los toman de ahí.

## 4. Asistente (`src/lib/chat/` + `/api/*`)

- `systemPrompt.ts` — `buildSystemPrompt()` genera el prompt desde `data.ts` (modelos, tarifas, fórmulas). Es **determinístico a propósito** (sin fechas ni valores por request) para no invalidar el prompt caching.
- `asistente.ts` — núcleo compartido:
  - `sanitizeMessages`: máx. 20 mensajes de 1500 chars, roles user/assistant, debe terminar en user (descarta un assistant inicial).
  - `responderAsistente`: llama a `claude-opus-4-8` con `thinking: adaptive`, `output_config.effort: low`, system prompt con `cache_control: ephemeral`. Refusal o respuesta vacía → texto de rechazo fijo. Tira `AsistenteSinConfigurar` si falta `ANTHROPIC_API_KEY`; los errores del SDK suben tal cual.
- `/api/chat` — usa el núcleo y traduce errores a castellano amigable: 429 rate limit, 503 sin configurar, 502 API caída. La UI (`ChatWidget`) degrada con esos mensajes; la calculadora nunca depende del chat.
- `/api/agente-test` — QA externo (ArtificialQA): mismo núcleo, pero (1) exige `Authorization: Bearer $AGENTE_TEST_TOKEN` (401 si no coincide, 503 si el server no tiene token), y (2) responde **formato OpenAI** (`object: "chat.completion"`, `choices[0].message.content`) para conectarse a plataformas de QA sin configuración extra. Solo lectura. ArtificialQA se conecta por URL + Bearer — su MCP server es aparte, para operar la plataforma.

## 5. UI

- `Calculator.tsx` (client) concentra todo el estado (modelo, cargador, batería, objetivo 80/100, tarifa, nafta con unidad l/100↔km/l) y deriva los resultados con el motor en cada render; los demás componentes son presentacionales. `PaybackSection` tiene su propio estado (USD, tipo de cambio, tarifas comparadas) y recibe solo `targetEnergyKw`.
- `EmojiRange.tsx` — slider con emoji: un `<input type="range">` **transparente** (conserva accesibilidad y área táctil de 44px) sobre un track pintado a mano (gradiente violeta → zona naranja hasta `highlightTo` → gris) con hitos (`marks`) y el emoji como thumb. El offset del thumb compensa su ancho: `calc(p% + (0.5 − p/100) × 30px)`. El CSS que anula la apariencia nativa está en `globals.css` (`.emoji-range`).
- Design system: "Hi BYD Argentina Design System" de claude.ai/design (leído vía DesignSync). Dark only `#1A1A1A`, violeta `#8812F9`/`#A445FB`, naranja `#FF8B00`/`#FFA62E`, verde `#4ADE80` reservado para ahorro/eléctrico, Ubuntu + Ubuntu Mono. Tokens en `globals.css` (`:root` + `@theme inline`). El DS anterior (Aurora, de la skill ui-ux-pro-max) quedó archivado en `design-system/hi-byd-arg/MASTER.md`.

## 6. Desarrollo local

```bash
npm run dev      # o el server "hi-byd-dev" de ~/.claude/launch.json (puerto 3210)
npm test         # 29 tests
npm run build    # build de producción
```

Variables (`.env.local`, ver `.env.example`): `ANTHROPIC_API_KEY` (sin ella el chat responde 503 y la app sigue) y `AGENTE_TEST_TOKEN` (ídem para `/api/agente-test`).

## 7. Deploy

- **Vercel CLI directo** (sin GitHub todavía): `vercel --prod` desde la raíz. Proyecto `hi-byd-arg-v2`, cuenta `federicopascale-9561`.
- Env vars de producción (ambas Sensitive): `ANTHROPIC_API_KEY` (la cargó Federico) y `AGENTE_TEST_TOKEN`. Alta: `vercel env add <NOMBRE> production --sensitive` + redeploy.
- La historia git es local. Cuando haya `gh auth login`: crear repo, pushear y conectar a Vercel para auto-deploys.

## 8. Deuda técnica / pendientes

1. Conexión GitHub → Vercel (hoy deploy por CLI).
2. Calibrar la curva DC con datos reales de la comunidad (hoy 75%/35% estimado).
3. Fases funcionales pendientes: ver [funcional.md §8](./funcional.md) y [CHANGELOG.md](./CHANGELOG.md).
