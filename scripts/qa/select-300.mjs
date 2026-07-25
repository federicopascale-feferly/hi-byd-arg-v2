// Selecciona 300 casos de los 500 maximizando diversidad de cobertura.
// Criterio: se conservan enteras las categorías cualitativas (cada caso es único
// y escrito a mano) y se recortan por muestreo estratificado las combinatorias
// numéricas, donde 80 variantes del mismo cálculo aportan poca señal nueva.
import { readFileSync, writeFileSync } from "node:fs";

const DIR = import.meta.dirname;
const todos = JSON.parse(readFileSync(`${DIR}/cases.json`, "utf8"));

// Cuota por categoría. null = conservar todas.
const CUOTAS = {
  // Cualitativas: 100%, son las que más discriminan comportamiento
  "prompt-injection": null,
  "honestidad": null,
  "fuera-de-alcance": null,
  "reglas-carga": null,
  "ambiguedad": null,
  "edge-case": null,
  "conversacional": null,
  "datos-tarifa": null,
  "wallbox-amortizacion": null,
  "derivacion-comercial": null,
  "formato-estilo": null,
  "tarifa-shell": null,
  "dc-forzado-ac": null,
  // Combinatorias: muestreo estratificado
  "datos-modelo": 40,
  "calculo-tiempo-ac": 24,
  "calculo-tiempo-dc": 24,
  "calculo-costo": 24,
  "costo-por-km": 14,
  "combinado-ac": 10,
  "combinado-dc": 8,
};

// Agrupa por categoría preservando el orden original
const porCat = new Map();
for (const c of todos) {
  if (!porCat.has(c.category)) porCat.set(c.category, []);
  porCat.get(c.category).push(c);
}

/**
 * Muestreo estratificado: reparte la cuota entre los estratos (modelo del auto,
 * que es el primer tag específico) y dentro de cada estrato toma con paso
 * uniforme, así no quedan todos los casos del mismo modelo o la misma tarifa.
 */
function muestrear(casos, n) {
  if (n >= casos.length) return casos;
  const estratos = new Map();
  for (const c of casos) {
    // el último tag es el modelo en las combinatorias; si no, cae en un estrato único
    const k = c.tags?.[c.tags.length - 1] ?? "_";
    if (!estratos.has(k)) estratos.set(k, []);
    estratos.get(k).push(c);
  }
  const claves = [...estratos.keys()];
  const out = [];
  let i = 0;
  // ronda por estrato hasta llenar la cuota, tomando con paso uniforme
  const cursores = new Map(claves.map((k) => [k, 0]));
  while (out.length < n) {
    const k = claves[i % claves.length];
    const grupo = estratos.get(k);
    const cur = cursores.get(k);
    if (cur < grupo.length) {
      const paso = Math.max(1, Math.floor(grupo.length / Math.ceil(n / claves.length)));
      out.push(grupo[Math.min(cur, grupo.length - 1)]);
      cursores.set(k, cur + paso);
    }
    i++;
    if (i > claves.length * grupo_max(estratos)) break; // guarda contra bucle infinito
  }
  return out.slice(0, n);
}
const grupo_max = (m) => Math.max(...[...m.values()].map((g) => g.length));

const sel = [];
const informe = [];
for (const [cat, casos] of porCat) {
  const cuota = CUOTAS[cat];
  const elegidos = cuota == null ? casos : muestrear(casos, cuota);
  const unicos = [...new Map(elegidos.map((c) => [c.title, c])).values()];
  sel.push(...unicos);
  informe.push({ cat, de: casos.length, a: unicos.length, completa: cuota == null });
}

// Ajuste fino si el muestreo dejó cortos por deduplicación
const faltan = 300 - sel.length;
if (faltan > 0) {
  const yaEstan = new Set(sel.map((c) => c.title));
  const reserva = todos.filter((c) => !yaEstan.has(c.title));
  sel.push(...reserva.slice(0, faltan));
} else if (faltan < 0) {
  // recorta de las combinatorias más grandes
  const recortables = ["combinado-ac", "calculo-costo", "combinado-dc", "calculo-tiempo-ac"];
  let sobran = -faltan;
  for (const cat of recortables) {
    while (sobran > 0) {
      const i = sel.findIndex((c) => c.category === cat);
      if (i < 0) break;
      sel.splice(i, 1);
      sobran--;
    }
    if (sobran === 0) break;
  }
}

informe.sort((a, b) => b.a - a.a);
console.log("Categoría".padEnd(24), "de".padStart(5), "→", "a".padStart(4), " completa");
for (const r of informe) {
  console.log(r.cat.padEnd(24), String(r.de).padStart(5), "→", String(r.a).padStart(4), r.completa ? "  sí" : "");
}
const finalCat = {};
for (const c of sel) finalCat[c.category] = (finalCat[c.category] || 0) + 1;
console.log("\nTotal seleccionado:", sel.length);
console.log("Conversacionales:", sel.filter((c) => c.type === "conversational").length);
console.log("Títulos únicos:", new Set(sel.map((c) => c.title)).size);

// Verifica que los 8 modelos y las 6 tarifas sigan representados
const MODELOS = ["atto2", "yuan", "dmgl", "dmgs", "shark", "spgl", "spgs", "sealu"];
const TARIFAS = ["epe", "epec", "edelap", "ypf", "chargebox", "combo"];
const tags = new Set(sel.flatMap((c) => c.tags ?? []));
const faltanMod = MODELOS.filter((m) => !tags.has(m));
const faltanTar = TARIFAS.filter((t) => !tags.has(t));
console.log("Modelos cubiertos:", MODELOS.length - faltanMod.length, "/ 8", faltanMod.length ? `FALTAN: ${faltanMod}` : "OK");
console.log("Tarifas cubiertas:", TARIFAS.length - faltanTar.length, "/ 6", faltanTar.length ? `FALTAN: ${faltanTar}` : "OK");

writeFileSync(`${DIR}/cases-300.json`, JSON.stringify(sel));
console.log(`\nEscrito cases-300.json (${(JSON.stringify(sel).length / 1024).toFixed(0)} KB)`);
