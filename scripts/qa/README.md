# QA de estrés del asistente — 500 casos

Estado al **2026-07-24**: casos generados y validados, carga a ArtificialQA **bloqueada** por el scope de la API key.

## Qué hay acá

| Archivo | Qué hace |
|---|---|
| `gen-cases.mjs` | Genera los 500 casos. Reimplementa `src/lib/calc/engine.ts` y **aborta si el autochequeo no da 5h 48m / 38,23 kWh** contra la carga real medida (Dolphin Mini GS 23→100% en AC 6,6 kW). Escribe `cases.json` + `batch-NN.json`. |
| `cases.json` | Los 500 casos ya generados. |
| `ingest.mjs` | Sube los casos por REST y los engancha a la suite. Lee la key de `.env.local`. |

Regenerar: `node scripts/qa/gen-cases.mjs`

## Recursos ya creados en ArtificialQA

- Suite `Asistente Hi BYD — Stress 500` → `654750af-a1c6-473f-a229-02c00079f4e7` (tiene 3 casos de prueba de humo)
- Plan `Asistente Hi BYD — Stress 500 (plan)` → `b572b568-7d0f-48b7-9750-4ada74425263` (ya vinculado a la suite)
- Conexión al agente `Asistente Hi BYD` → `05bbf3f0-907f-470a-91a4-1a001f196600`
- Proyecto → `9644b5f9-6f0f-43f0-a7d7-2292b9347f2e`

Están aparte del plan de QA baseline de 10 casos, para no contaminar su histórico de 3 runs (0,974 / 0,978 / 0,990).

## El bloqueo

La `ARTIFICIALQA_API_KEY` en `.env.local` es **read-only**:

- `GET /api/v1/public/test-cases` → 200 JSON
- `POST /api/v1/public/test-cases/import` → 403
- `POST /api/v1/public/test-cases/bulk` → 405

El 403 (y no 405) en los paths de escritura confirma que **los paths son correctos** y que falta permiso, no que el endpoint esté mal.

**Para retomar:** regenerar la key con scope `write` en app.artificialqa.com, reemplazarla en `.env.local` (cerrar nano antes de editar por fuera, un buffer viejo ya pisó un cambio una vez) y correr:

```bash
node scripts/qa/ingest.mjs
```

Importa los ~497 pendientes en 5 lotes de 100, engancha los 500 con 8 conexiones en paralelo y verifica que `testCount` llegue a 500. Estimado ~5 min (rate limit `x-ratelimit-limit: 120`).

Vía alternativa sin key: el **MCP sí tiene write** (con él se crearon suite, plan y los 3 casos), pero `add_test_case_to_suite` toma un caso por llamada a ~9 s → ~75 min para los 500.

## Después de cargar

Run con los **17 evaluadores** (decisión de Federico). Costo a tener presente: 500 llamadas al endpoint de Vercel, cada una invocando Claude con `ANTHROPIC_API_KEY`, más ~8.500 evaluaciones LLM. Es el motivo por el que se suspendió el 2026-07-24.

## Composición de los 500

| Categoría | N |
|---|---|
| Combinado AC (tiempo + kWh + costo) | 83 |
| Costo por tarifa | 66 |
| Fichas de los 8 modelos | 57 |
| Tiempo AC | 48 |
| Tiempo DC con taper | 36 |
| Combinado DC | 28 |
| Costo por km vs nafta | 26 |
| Honestidad (modelos y specs inexistentes) | 22 |
| Prompt injection | 22 |
| Fuera de alcance | 20 |
| Reglas DC vs AC / 80 vs 100 | 15 |
| Datos de tarifa | 12 |
| Ambigüedad | 12 |
| Edge cases numéricos | 12 |
| Conversacional multi-turno | 10 |
| Wallbox / amortización | 8 |
| Derivación comercial | 8 |
| Formato y estilo | 6 |
| Shell por minuto | 5 |
| DC forzado a AC | 4 |

## Hallazgo de producto (ArtificialQA)

La API pública **devuelve HTML en los errores**, no JSON: el 403 y el 405 vienen con `content-type: text/html` y un `<!DOCTYPE html>` completo. Cualquier cliente que haga `await res.json()` sobre un error revienta con un parse error en vez de leer el motivo. Un `{ "error": "insufficient_scope" }` ahorraría soporte. Vale pasarlo al equipo.
