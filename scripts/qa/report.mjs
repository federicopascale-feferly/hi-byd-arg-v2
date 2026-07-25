// Reporta una evaluación: score por evaluador, casos más flojos y explicaciones.
// Uso: EVAL_ID=... EXEC_ID=... node scripts/qa/report.mjs
import { readFileSync } from "node:fs";

const KEY = [...readFileSync("/Users/feferly/Hi BYD ARG v2/.env.local", "utf8")
  .matchAll(/^ARTIFICIALQA_API_KEY=(.*)$/gm)][0][1].trim();
const B = "https://app.artificialqa.com";
const h = { Authorization: `Bearer ${KEY}` };
const get = async (p) => (await (await fetch(B + p, { headers: h })).json());

const EVAL_ID = process.env.EVAL_ID;
const EXEC_ID = process.env.EXEC_ID;
if (!EVAL_ID) { console.error("Falta EVAL_ID"); process.exit(1); }

// Ojo: evaluations devuelve el objeto en la raíz; test-cases lo envuelve en data.
const _e = await get(`/api/v1/public/evaluations/${EVAL_ID}`);
const e = _e.data ?? _e;

// Títulos: paginar test-cases (nextCursor va en el nivel raíz)
const titulo = new Map();
let cur = null;
do {
  const j = await get(`/api/v1/public/test-cases?limit=100${cur ? `&cursor=${encodeURIComponent(cur)}` : ""}`);
  for (const tc of j.data ?? []) titulo.set(tc.id, tc.title);
  cur = j.nextCursor;
} while (cur);

const prom = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const porEval = new Map(), porCaso = new Map();
for (const s of e.scores ?? []) {
  if (!porEval.has(s.evaluatorName)) porEval.set(s.evaluatorName, []);
  porEval.get(s.evaluatorName).push(s.score);
  if (!porCaso.has(s.testCaseId)) porCaso.set(s.testCaseId, []);
  porCaso.get(s.testCaseId).push(s.score);
}

console.log(`Score global ${(e.overallScore * 100).toFixed(1)}% | passRate ${(e.passRate * 100).toFixed(0)}% | ${e.passedCases}/${e.totalCases} casos | ${Math.round(e.durationMs / 1000)}s\n`);

console.log("── Por evaluador ──");
[...porEval.entries()]
  .map(([n, a]) => [n, prom(a), a.filter((x) => x < 1).length])
  .sort((a, b) => a[1] - b[1])
  .forEach(([n, p, bajo]) => console.log(`  ${n.padEnd(16)} ${(p * 100).toFixed(1).padStart(5)}%   casos por debajo de 1: ${bajo}`));

console.log("\n── 10 casos más flojos ──");
const flojos = [...porCaso.entries()].map(([id, a]) => [id, prom(a)]).sort((a, b) => a[1] - b[1]).slice(0, 10);
for (const [id, p] of flojos) console.log(`  ${(p * 100).toFixed(1).padStart(5)}%  ${titulo.get(id) ?? id.slice(0, 8)}`);

console.log("\n── Dónde bajó y por qué (scores < 1) ──");
const bajos = (e.scores ?? []).filter((s) => s.score < 1).sort((a, b) => a.score - b.score);
console.log(`  ${bajos.length} de ${e.scores.length} puntuaciones por debajo de 1\n`);
for (const s of bajos.slice(0, 12)) {
  console.log(`  [${s.evaluatorName} ${(s.score * 100).toFixed(0)}%] ${titulo.get(s.testCaseId) ?? ""}`);
  console.log(`     ${(s.explanation ?? "").replace(/\s+/g, " ").slice(0, 240)}\n`);
}

if (EXEC_ID) {
  const _x = await get(`/api/v1/public/executions/${EXEC_ID}`);
  const x = _x.data ?? _x;
  const tiempos = (x.results ?? []).map((r) => r.responseTimeMs).filter(Boolean).sort((a, b) => a - b);
  if (tiempos.length) {
    const pct = (q) => tiempos[Math.floor(tiempos.length * q)];
    console.log("── Latencia del agente ──");
    console.log(`  mediana ${(pct(0.5) / 1000).toFixed(1)}s | p90 ${(pct(0.9) / 1000).toFixed(1)}s | máx ${(tiempos.at(-1) / 1000).toFixed(1)}s`);
    console.log(`  fallos de ejecución: ${(x.results ?? []).filter((r) => !r.success).length}`);
  }
}
