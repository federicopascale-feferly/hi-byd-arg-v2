// Arma una suite + plan piloto de 30 casos estratificados y los engancha.
// Los 300 casos ya existen en el proyecto: acá solo se seleccionan y se linkean.
import { readFileSync } from "node:fs";

const DIR = import.meta.dirname;
const B = "https://app.artificialqa.com";
const AGENT_ID = "05bbf3f0-907f-470a-91a4-1a001f196600";

const KEY = [...readFileSync("/Users/feferly/Hi BYD ARG v2/.env.local", "utf8")
  .matchAll(/^ARTIFICIALQA_API_KEY=(.*)$/gm)][0][1].trim();
const h = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const api = async (method, path, body, intento = 0) => {
  const res = await fetch(`${B}${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 429 && intento < 6) {
    const espera = Number(res.headers.get("retry-after")) * 1000 || 2000 * 2 ** intento;
    await dormir(espera);
    return api(method, path, body, intento + 1);
  }
  const t = await res.text();
  let json = null; try { json = JSON.parse(t); } catch {}
  return { ok: res.ok, status: res.status, json, text: t.slice(0, 200) };
};

// Cuotas: peso extra donde más importa validar que la evaluación discrimine.
const CUOTAS = {
  "reglas-carga": 3, "honestidad": 3, "prompt-injection": 3,
  "calculo-tiempo-ac": 2, "calculo-tiempo-dc": 2, "calculo-costo": 2,
  "conversacional": 2, "ambiguedad": 2, "edge-case": 2, "fuera-de-alcance": 2,
  "datos-modelo": 2,
  "costo-por-km": 1, "datos-tarifa": 1, "dc-forzado-ac": 1,
  "formato-estilo": 1, "tarifa-shell": 1,
};

const todos = JSON.parse(readFileSync(`${DIR}/cases-300.json`, "utf8"));
const porCat = new Map();
for (const c of todos) {
  if (!porCat.has(c.category)) porCat.set(c.category, []);
  porCat.get(c.category).push(c);
}

// Toma con paso uniforme dentro de cada categoría para no agarrar todos del mismo modelo
const sel = [];
for (const [cat, n] of Object.entries(CUOTAS)) {
  const grupo = porCat.get(cat) ?? [];
  const paso = Math.max(1, Math.floor(grupo.length / n));
  for (let i = 0; i < n && i * paso < grupo.length; i++) sel.push(grupo[i * paso]);
}
console.log(`Seleccionados ${sel.length} casos de ${Object.keys(CUOTAS).length} categorías\n`);
for (const c of sel) console.log(`  [${c.category}] ${c.title}`);

// Resolver IDs por título
console.log("\nResolviendo IDs...");
// Ojo: nextCursor viene en el nivel raíz de la respuesta, NO dentro de data.
const existentes = new Map();
let cursor = null;
do {
  const r = await api("GET", `/api/v1/public/test-cases?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
  if (!r.ok) { console.error(`FALLA ${r.status}`); process.exit(1); }
  for (const tc of r.json.data ?? []) existentes.set(tc.title, tc.id);
  cursor = r.json.nextCursor ?? null;
} while (cursor);
console.log(`  ${existentes.size} casos leídos del proyecto`);

const ids = [], sinId = [];
for (const c of sel) {
  const id = existentes.get(c.title);
  if (id) ids.push(id); else sinId.push(c.title);
}
console.log(`  resueltos ${ids.length}/${sel.length}`);
if (sinId.length) { console.error("  sin ID:", sinId); process.exit(1); }

// Suite piloto
const s = await api("POST", "/api/v1/public/test-suites", {
  name: "Asistente Hi BYD — Piloto 30",
  description: "Submuestra estratificada de 30 casos del set de 300, para validar que los expectedOutput discriminen antes del run completo.",
  tags: ["hi-byd", "piloto", "30"],
});
if (!s.ok) { console.error(`FALLA suite ${s.status} → ${s.text}`); process.exit(1); }
const SUITE = s.json?.data?.id ?? s.json?.id;
console.log(`\nSuite piloto: ${SUITE}`);

let ok = 0;
for (const id of ids) {
  const r = await api("POST", `/api/v1/public/test-suites/${SUITE}/test-cases`, { testCaseId: id });
  if (r.ok || r.status === 409) ok++;
  else console.error(`  fallo ${r.status}: ${r.text}`);
}
console.log(`Enganchados: ${ok}/${ids.length}`);

// Plan piloto
const p = await api("POST", "/api/v1/public/test-plans", {
  name: "Asistente Hi BYD — Piloto 30 (plan)",
  description: "Piloto de 30 casos previo al run de 300.",
  agentConnectionId: AGENT_ID,
  status: "draft",
});
if (!p.ok) { console.error(`FALLA plan ${p.status} → ${p.text}`); process.exit(1); }
const PLAN = p.json?.data?.id ?? p.json?.id;
const l = await api("POST", `/api/v1/public/test-plans/${PLAN}/suites`, { testSuiteId: SUITE });
console.log(`Plan piloto: ${PLAN} | suite vinculada: ${l.ok ? "sí" : `FALLA ${l.status} ${l.text}`}`);

const ver = await api("GET", `/api/v1/public/test-suites/${SUITE}`);
console.log(`\ntestCount de la suite piloto: ${(ver.json?.data ?? ver.json)?.testCount}`);
console.log(`\nPara correrlo:  PLAN_ID=${PLAN} node scripts/qa/run.mjs`);
