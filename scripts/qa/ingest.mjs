// Sube los casos a ArtificialQA por REST y los engancha a la suite.
// Requiere ARTIFICIALQA_API_KEY (scope write) y ARTIFICIALQA_BASE_URL.
import { readFileSync } from "node:fs";

const SCRATCH = import.meta.dirname;
const SUITE_ID = "654750af-a1c6-473f-a229-02c00079f4e7";

// Archivo de casos a subir: los 300 seleccionados (o cases.json para los 500).
const CASOS_FILE = process.env.CASOS_FILE || "cases-300.json";

const ENV_FILE = "/Users/feferly/Hi BYD ARG v2/.env.local";
const env = Object.fromEntries(
  readFileSync(ENV_FILE, "utf8")
    .split("\n")
    .map((l) => l.match(/^([A-Z_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
);
const KEY = env.ARTIFICIALQA_API_KEY;
const BASE = (env.ARTIFICIALQA_BASE_URL || "").replace(/\/$/, "");
if (!KEY) { console.error("Falta ARTIFICIALQA_API_KEY"); process.exit(1); }
if (!BASE) { console.error("Falta ARTIFICIALQA_BASE_URL (ej. https://app.artificialqa.com)"); process.exit(1); }

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// El rate limit de la API es 120 (visto en x-ratelimit-limit), y 300 enganches lo
// pasan de largo: reintenta con backoff respetando Retry-After cuando viene.
const api = async (method, path, body, intento = 0) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 429 && intento < 6) {
    const espera = Number(res.headers.get("retry-after")) * 1000 || 2000 * 2 ** intento;
    console.log(`  429 rate limit, esperando ${Math.round(espera / 1000)}s...`);
    await dormir(espera);
    return api(method, path, body, intento + 1);
  }
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  const restante = res.headers.get("x-ratelimit-remaining");
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 400), restante };
};

// ── 1. Probe de autenticación ──────────────────────────────────────────────────
console.log(`Probe: GET ${BASE}/api/v1/public/test-suites`);
const probe = await api("GET", "/api/v1/public/test-suites?limit=1");
console.log(`  status ${probe.status}`, probe.ok ? "OK" : `FALLA → ${probe.text}`);
if (!probe.ok) {
  console.error("\nLa key o la URL no funcionan. Verificá el dominio y que la key tenga scope de lectura/escritura.");
  process.exit(1);
}

// ── 2. Dedupe contra lo que ya existe en el proyecto ───────────────────────────
const todos = JSON.parse(readFileSync(`${SCRATCH}/${CASOS_FILE}`, "utf8"));
console.log(`\nArchivo: ${CASOS_FILE} → ${todos.length} casos`);

console.log("Leyendo títulos ya existentes en el proyecto...");
// Ojo: nextCursor viene en el nivel raíz de la respuesta, NO dentro de data.
// Leerlo de data deja la paginación en la primera página y rompe el dedupe.
const existentes = new Map(); // título → id
let cursor = null;
do {
  const q = `/api/v1/public/test-cases?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
  const r = await api("GET", q);
  if (!r.ok) { console.error(`  FALLA ${r.status} → ${r.text}`); process.exit(1); }
  for (const tc of r.json.data ?? []) existentes.set(tc.title, tc.id);
  cursor = r.json.nextCursor ?? null;
} while (cursor);
console.log(`  ${existentes.size} casos ya en el proyecto`);

const pendientes = todos.filter((c) => !existentes.has(c.title));
const yaCreados = todos.filter((c) => existentes.has(c.title)).map((c) => existentes.get(c.title));
console.log(`  ya creados de este set: ${yaCreados.length} | a importar: ${pendientes.length}`);

const creados = [];
const LOTE = 100;
for (let i = 0; i < pendientes.length; i += LOTE) {
  const chunk = pendientes.slice(i, i + LOTE);
  const nLote = Math.floor(i / LOTE) + 1;
  const r = await api("POST", "/api/v1/public/test-cases/import", {
    idempotencyKey: `hibyd-stress300-lote-${nLote}-v1`,
    items: chunk,
  });
  if (!r.ok) { console.error(`  lote ${nLote}: FALLA ${r.status} → ${r.text}`); process.exit(1); }
  const ids = r.json?.data?.createdIds ?? r.json?.createdIds ?? [];
  const errs = r.json?.data?.errors ?? r.json?.errors ?? [];
  creados.push(...ids);
  console.log(`  lote ${nLote}: ${ids.length} creados${errs.length ? `, ${errs.length} errores` : ""}`);
  if (errs.length) console.log("   ", JSON.stringify(errs).slice(0, 300));
}
console.log(`\nCreados en total: ${creados.length}`);

// Los ya existentes también hay que engancharlos (el 409 de duplicado es inocuo).
creados.push(...yaCreados);

// ── 3. Enganche a la suite, en paralelo ────────────────────────────────────────
console.log(`\nEnganchando ${creados.length} casos a la suite...`);
const CONC = 8;
let hechos = 0, fallos = 0;
const cola = [...creados];
await Promise.all(
  Array.from({ length: CONC }, async () => {
    while (cola.length) {
      const id = cola.shift();
      const r = await api("POST", `/api/v1/public/test-suites/${SUITE_ID}/test-cases`, { testCaseId: id });
      if (r.ok || r.status === 409) hechos++;
      else { fallos++; if (fallos <= 3) console.error(`  fallo ${r.status}: ${r.text}`); }
      if ((hechos + fallos) % 50 === 0) console.log(`  ${hechos + fallos}/${creados.length}`);
    }
  }),
);
console.log(`\nEnganchados: ${hechos} | fallos: ${fallos}`);

// ── 4. Verificación final ──────────────────────────────────────────────────────
const suite = await api("GET", `/api/v1/public/test-suites/${SUITE_ID}`);
const count = suite.json?.data?.testCount ?? suite.json?.testCount ?? "?";
console.log(`\nSuite ${SUITE_ID} → testCount = ${count} (esperado ${todos.length})`);
