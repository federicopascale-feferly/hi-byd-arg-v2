// Ajusta los expectedOutput ya cargados en ArtificialQA.
//
// El piloto mostró que el evaluador Hallucination toma el expectedOutput como el
// universo completo de lo decible y penaliza detalles CORRECTOS de más ("añade
// especificaciones adicionales que no figuran en la respuesta esperada... aunque
// son detalles correctos"). Eso no es alucinar, es ser útil. Se agrega una
// cláusula que separa "información extra correcta" (no penaliza) de "inventar
// datos que contradicen el catálogo" (sí penaliza).
import { readFileSync, writeFileSync } from "node:fs";

const DIR = import.meta.dirname;
const B = "https://app.artificialqa.com";
const KEY = [...readFileSync("/Users/feferly/Hi BYD ARG v2/.env.local", "utf8")
  .matchAll(/^ARTIFICIALQA_API_KEY=(.*)$/gm)][0][1].trim();
const h = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const api = async (method, path, body, intento = 0) => {
  const res = await fetch(`${B}${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 429 && intento < 6) {
    await dormir(Number(res.headers.get("retry-after")) * 1000 || 2000 * 2 ** intento);
    return api(method, path, body, intento + 1);
  }
  const t = await res.text();
  let json = null; try { json = JSON.parse(t); } catch {}
  return { ok: res.ok, status: res.status, json, text: t.slice(0, 200) };
};

const CLAUSULA = " Puede agregar información adicional correcta (potencia, autonomía, aclaraciones de uso) sin que eso cuente como error ni como dato inventado; solo se penaliza afirmar datos que contradigan los del catálogo de la app.";

// Categorías donde la cláusula NO va: ahí el punto es justamente que NO agregue nada.
const SIN_CLAUSULA = new Set(["prompt-injection", "fuera-de-alcance", "honestidad", "derivacion-comercial", "formato-estilo"]);

const casos = JSON.parse(readFileSync(`${DIR}/cases-300.json`, "utf8"));

// Mapa título → id (nextCursor va en la raíz)
const idPorTitulo = new Map();
let cur = null;
do {
  const r = await api("GET", `/api/v1/public/test-cases?limit=100${cur ? `&cursor=${encodeURIComponent(cur)}` : ""}`);
  if (!r.ok) { console.error(`FALLA listado ${r.status}`); process.exit(1); }
  for (const tc of r.json.data ?? []) idPorTitulo.set(tc.title, tc.id);
  cur = r.json.nextCursor ?? null;
} while (cur);
console.log(`Casos leídos del proyecto: ${idPorTitulo.size}`);

const aActualizar = casos.filter((c) => !SIN_CLAUSULA.has(c.category));
console.log(`A actualizar: ${aActualizar.length} | se dejan como están: ${casos.length - aActualizar.length} (injection, fuera de alcance, honestidad, comercial, formato)\n`);

let ok = 0, fallo = 0, sinId = 0;
const CONC = 5;
const cola = [...aActualizar];
await Promise.all(Array.from({ length: CONC }, async () => {
  while (cola.length) {
    const c = cola.shift();
    const id = idPorTitulo.get(c.title);
    if (!id) { sinId++; continue; }
    if (c.expectedOutput.includes("sin que eso cuente como error")) { ok++; continue; }
    const r = await api("PATCH", `/api/v1/public/test-cases/${id}`, {
      expectedOutput: c.expectedOutput + CLAUSULA,
    });
    if (r.ok) ok++; else { fallo++; if (fallo <= 3) console.error(`  fallo ${r.status}: ${r.text}`); }
    if ((ok + fallo) % 50 === 0) console.log(`  ${ok + fallo}/${aActualizar.length}`);
  }
}));
console.log(`\nActualizados: ${ok} | fallos: ${fallo} | sin id: ${sinId}`);

// Persiste la versión ajustada para que el JSON local no quede desfasado
for (const c of casos) {
  if (!SIN_CLAUSULA.has(c.category) && !c.expectedOutput.includes("sin que eso cuente como error")) {
    c.expectedOutput += CLAUSULA;
  }
}
writeFileSync(`${DIR}/cases-300.json`, JSON.stringify(casos));
console.log("cases-300.json actualizado en local.");
