// Lanza la ejecución del plan de estrés y su evaluación, y reporta el resultado.
import { readFileSync } from "node:fs";

// Por defecto el plan de 300; PLAN_ID=... para correr el piloto u otro plan.
const PLAN_ID = process.env.PLAN_ID || "b572b568-7d0f-48b7-9750-4ada74425263";
const AGENT_ID = "05bbf3f0-907f-470a-91a4-1a001f196600";

// Los 10 evaluadores elegidos. Los 8 primeros son los del baseline histórico
// (runs 0,974 / 0,978 / 0,990), así que el resultado sigue siendo comparable.
const EVALUADORES = {
  "Comparison":     "533146e9-9968-40f8-884b-e7935afd3618",
  "Data Accuracy":  "48cf9609-d4ff-49ce-ad24-dda158df739c",
  "Hallucination":  "da62fa4b-ff99-485d-874a-4959eee13d41",
  "Completeness":   "94b3ae0e-3079-4b2c-807b-70257b27a5eb",
  "Error Handling": "d2738e08-5c0b-4b6e-9a32-e3aea05f4c41",
  "Ambiguity":      "67c1cfb9-0c6f-4047-bc18-6b44bd537e61",
  "Language":       "b512ed6e-8ccc-4edf-9a77-ee88b46927ff",
  "Security":       "a705f190-40a6-4c76-bbe1-ae1bf41aca0f",
  "Conciseness":    "8b9c0214-5f0f-4be8-928a-7ff67e9bf51a",
  "Consistency":    "9a014df9-a0dd-43b4-b7b4-05e5538b5b26",
};

const env = Object.fromEntries(
  readFileSync("/Users/feferly/Hi BYD ARG v2/.env.local", "utf8")
    .split("\n").map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
);
const BASE = (env.ARTIFICIALQA_BASE_URL || "https://app.artificialqa.com").replace(/\/$/, "");
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const api = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${env.ARTIFICIALQA_API_KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 300) };
};

const DRY = process.argv.includes("--dry-run");
if (DRY) {
  console.log("DRY RUN — no dispara nada.\n");
  console.log("Plan:", PLAN_ID);
  console.log("Agente:", AGENT_ID);
  console.log("Evaluadores:", Object.keys(EVALUADORES).length);
  for (const n of Object.keys(EVALUADORES)) console.log("  -", n);
  const suite = await api("GET", "/api/v1/public/test-suites/654750af-a1c6-473f-a229-02c00079f4e7");
  console.log("\nCasos en la suite:", suite.json?.data?.testCount ?? suite.json?.testCount ?? "?");
  process.exit(0);
}

// El plan tiene que estar en "ready" o "completed": en "draft" el POST da 409.
const pl = await api("GET", `/api/v1/public/test-plans/${PLAN_ID}`);
const estadoPlan = (pl.json?.data ?? pl.json)?.status;
if (estadoPlan === "draft") {
  console.log('Plan en "draft", pasándolo a "ready"...');
  const up = await api("PATCH", `/api/v1/public/test-plans/${PLAN_ID}`, { status: "ready" });
  if (!up.ok) { console.error(`No se pudo: ${up.status} → ${up.text}`); process.exit(1); }
}

console.log("Lanzando ejecución...");
const ex = await api("POST", `/api/v1/public/test-plans/${PLAN_ID}/executions`, {
  agentConnectionId: AGENT_ID,
  evaluate: true,
  evaluatorIds: Object.values(EVALUADORES),
  idempotencyKey: `hibyd-run-${PLAN_ID.slice(0, 8)}-${Date.now()}`,
});
if (!ex.ok) { console.error(`FALLA ${ex.status} → ${ex.text}`); process.exit(1); }
const exId = ex.json?.executionId ?? ex.json?.data?.id ?? ex.json?.id;
console.log("executionId:", exId);

let estado = "pending", t0 = Date.now();
while (!["completed", "failed", "cancelled"].includes(estado)) {
  await dormir(15000);
  const r = await api("GET", `/api/v1/public/executions/${exId}`);
  const d = r.json?.data ?? r.json;
  estado = d?.status ?? estado;
  const hechos = d?.results?.length ?? d?.completedCount ?? "?";
  console.log(`  ${Math.round((Date.now() - t0) / 1000)}s | ${estado} | ${hechos} casos`);
}
console.log("\nEjecución:", estado);

const fin = await api("GET", `/api/v1/public/executions/${exId}`);
const d = fin.json?.data ?? fin.json;
console.log(JSON.stringify(d?.evaluationSummary ?? d?.evaluation ?? {}, null, 2).slice(0, 1500));
