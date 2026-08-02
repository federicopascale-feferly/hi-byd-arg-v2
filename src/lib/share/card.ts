import { formatARS, formatARSFino, formatNum } from "@/lib/format";

/** Datos que se muestran en la tarjeta compartible */
export interface ShareCardData {
  modelo: string;
  tipo: "EV" | "PHEV";
  desdePct: number;
  hastaPct: number;
  cargador: string;
  potenciaKw: number;
  tiempo: string;
  energiaKwh: number;
  kmAgregados: number;
  costoSesion: number;
  tarifaNombre: string;
  costoShell: number | null;
  costoKmElectrico: number | null;
  costoKmNafta: number | null;
  ahorroPorcentual: number | null;
  curvaEstimada: boolean;
}

/** Tarjeta 4:5, la relación que mejor entra en WhatsApp e Instagram */
export const CARD_W = 1080;
export const CARD_H = 1350;

const PAD = 72;
const C = {
  bg: "#1a1a1a",
  surface: "#242424",
  border: "rgba(255,255,255,0.12)",
  fg: "#ffffff",
  muted: "#b3b3b3",
  primary: "#8812f9",
  primaryHover: "#a445fb",
  accent: "#ffa62e",
  accentFill: "#ff8b00",
  success: "#4ade80",
};

/** La familia real que resolvió next/font, para que el canvas use la misma tipografía que la app */
function fontFamily(): string {
  if (typeof window === "undefined") return "system-ui, sans-serif";
  const resolved = getComputedStyle(document.body).fontFamily;
  return resolved || "system-ui, sans-serif";
}

function setFont(ctx: CanvasRenderingContext2D, size: number, weight = 400, spacing = 0) {
  ctx.font = `${weight} ${size}px ${fontFamily()}`;
  ctx.letterSpacing = `${spacing}px`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

function fillRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string,
) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/** Caja con etiqueta chica arriba y valor grande abajo */
function statBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  unit?: string,
) {
  fillRound(ctx, x, y, w, h, 20, C.surface, C.border);

  ctx.textAlign = "left";
  setFont(ctx, 22, 400);
  ctx.fillStyle = C.muted;
  ctx.fillText(label, x + 28, y + 44);

  setFont(ctx, 40, 700);
  ctx.fillStyle = C.fg;
  ctx.fillText(value, x + 28, y + 94);

  if (unit) {
    const vw = ctx.measureText(value).width;
    setFont(ctx, 22, 400);
    ctx.fillStyle = C.muted;
    ctx.fillText(unit, x + 28 + vw + 10, y + 94);
  }
}

/** Fila de costo por km: etiqueta, valor y barra proporcional */
function costRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  label: string,
  value: string,
  ratio: number,
  color: string,
) {
  ctx.textAlign = "left";
  setFont(ctx, 26, 400);
  ctx.fillStyle = C.fg;
  ctx.fillText(label, x, y);

  ctx.textAlign = "right";
  setFont(ctx, 28, 700);
  ctx.fillStyle = color;
  ctx.fillText(value, x + w, y);

  fillRound(ctx, x, y + 18, w, 14, 7, "rgba(255,255,255,0.10)");
  const bw = Math.max(w * Math.min(Math.max(ratio, 0), 1), 14);
  fillRound(ctx, x, y + 18, bw, 14, 7, color);
}

/**
 * Dibuja la tarjeta de resultados en un canvas nuevo.
 * Todo se dibuja a mano (no html2canvas) porque Tailwind v4 emite colores oklch
 * que html2canvas no sabe parsear.
 */
export function drawShareCard(data: ShareCardData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas de la tarjeta.");

  ctx.textBaseline = "alphabetic";

  // Fondo + glow de marca (mismo tratamiento que el body de la app)
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const glow = ctx.createRadialGradient(CARD_W / 2, 0, 0, CARD_W / 2, 0, CARD_W * 0.85);
  glow.addColorStop(0, "rgba(136,18,249,0.30)");
  glow.addColorStop(1, "rgba(136,18,249,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H * 0.6);

  const glow2 = ctx.createRadialGradient(CARD_W, CARD_H, 0, CARD_W, CARD_H, CARD_W * 0.6);
  glow2.addColorStop(0, "rgba(255,139,0,0.12)");
  glow2.addColorStop(1, "rgba(255,139,0,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(CARD_W * 0.4, CARD_H * 0.5, CARD_W * 0.6, CARD_H * 0.5);

  const inner = CARD_W - PAD * 2;

  // Encabezado
  ctx.textAlign = "left";
  setFont(ctx, 24, 700, 5);
  ctx.fillStyle = C.accent;
  ctx.fillText("HI BYD ARGENTINA", PAD, 100);

  setFont(ctx, 58, 700);
  const titleGrad = ctx.createLinearGradient(PAD, 0, PAD + 560, 0);
  titleGrad.addColorStop(0, C.primaryHover);
  titleGrad.addColorStop(1, C.accentFill);
  ctx.fillStyle = titleGrad;
  ctx.fillText("Calculadora de carga", PAD, 170);

  // Modelo elegido
  const modelY = 218;
  fillRound(ctx, PAD, modelY, inner, 140, 24, C.primary);

  setFont(ctx, 46, 700);
  ctx.fillStyle = C.fg;
  ctx.fillText(data.modelo, PAD + 36, modelY + 62);

  const nameW = ctx.measureText(data.modelo).width;
  setFont(ctx, 22, 700, 1);
  const badgeW = ctx.measureText(data.tipo).width + 34;
  fillRound(ctx, PAD + 36 + nameW + 22, modelY + 32, badgeW, 42, 21, "rgba(255,255,255,0.22)");
  ctx.fillStyle = C.fg;
  ctx.fillText(data.tipo, PAD + 36 + nameW + 39, modelY + 61);

  setFont(ctx, 26, 400);
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fillText(
    `${formatNum(data.desdePct)}% → ${data.hastaPct}%  ·  ${data.cargador}  ·  ${formatNum(data.potenciaKw)} kW`,
    PAD + 36,
    modelY + 108,
  );

  // Tiempo de carga (dato principal)
  const heroY = 388;
  fillRound(ctx, PAD, heroY, inner, 180, 24, C.surface, C.border);

  setFont(ctx, 22, 400, 3);
  ctx.fillStyle = C.muted;
  ctx.fillText("TIEMPO DE CARGA ESTIMADO", PAD + 36, heroY + 54);

  setFont(ctx, 88, 700);
  ctx.fillStyle = C.primaryHover;
  ctx.fillText(data.tiempo, PAD + 36, heroY + 146);

  // Métricas
  const gap = 24;
  const boxW = (inner - gap) / 2;
  const boxH = 124;
  const gridY = 600;

  statBox(ctx, PAD, gridY, boxW, boxH, "Energía a cargar", formatNum(data.energiaKwh), "kWh");
  statBox(ctx, PAD + boxW + gap, gridY, boxW, boxH, "Autonomía agregada", `+${data.kmAgregados}`, "km");

  const row2 = gridY + boxH + gap;
  statBox(ctx, PAD, row2, boxW, boxH, `Costo · ${data.tarifaNombre}`, formatARS(data.costoSesion));

  if (data.costoShell !== null) {
    statBox(ctx, PAD + boxW + gap, row2, boxW, boxH, "Shell (por minuto)", formatARS(data.costoShell));
  } else {
    statBox(
      ctx,
      PAD + boxW + gap,
      row2,
      boxW,
      boxH,
      "Potencia efectiva",
      formatNum(data.potenciaKw),
      "kW",
    );
  }

  // Costo por km vs. nafta
  let y = row2 + boxH + 58;

  if (data.costoKmElectrico !== null && data.costoKmNafta !== null) {
    setFont(ctx, 22, 400, 3);
    ctx.textAlign = "left";
    ctx.fillStyle = C.muted;
    ctx.fillText("COSTO POR KM", PAD, y);

    const ratio = data.costoKmNafta > 0 ? data.costoKmElectrico / data.costoKmNafta : 0;
    costRow(ctx, PAD, y + 52, inner, "Eléctrico", `${formatARSFino(data.costoKmElectrico)}/km`, ratio, C.success);
    costRow(ctx, PAD, y + 124, inner, "Nafta", `${formatARSFino(data.costoKmNafta)}/km`, 1, C.muted);

    y += 176;

    if (data.ahorroPorcentual !== null) {
      const ahorra = data.ahorroPorcentual >= 0;
      fillRound(ctx, PAD, y, inner, 80, 20, ahorra ? "rgba(74,222,128,0.14)" : "rgba(248,113,113,0.14)");

      ctx.textAlign = "center";
      setFont(ctx, 32, 700);
      ctx.fillStyle = ahorra ? C.success : "#f87171";
      const pct = `${formatNum(Math.abs(data.ahorroPorcentual))}%`;
      const tail = ahorra ? " de ahorro por km vs. nafta" : " más caro por km vs. nafta";

      const pctW = ctx.measureText(pct).width;
      setFont(ctx, 28, 400);
      const tailW = ctx.measureText(tail).width;
      const startX = CARD_W / 2 - (pctW + tailW) / 2;

      ctx.textAlign = "left";
      setFont(ctx, 32, 700);
      ctx.fillStyle = ahorra ? C.success : "#f87171";
      ctx.fillText(pct, startX, y + 52);
      setFont(ctx, 28, 400);
      ctx.fillStyle = C.fg;
      ctx.fillText(tail, startX + pctW, y + 52);

      y += 96;
    }
  }

  // Notas al pie (máximo 2, dejando aire antes del pie de página)
  ctx.textAlign = "left";
  setFont(ctx, 20, 400);
  ctx.fillStyle = C.muted;
  const notas: string[] = [];
  if (data.curvaEstimada) notas.push("Curva DC estimada (taper desde 75%), no es dato de fábrica.");
  if (data.tipo === "PHEV") notas.push("Híbrido enchufable: el costo por km vale en modo 100% eléctrico.");
  notas.slice(0, 2).forEach((n, i) => ctx.fillText(n, PAD, y + i * 26));

  // Pie
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, CARD_H - 96);
  ctx.lineTo(CARD_W - PAD, CARD_H - 96);
  ctx.stroke();

  setFont(ctx, 26, 700);
  ctx.fillStyle = C.fg;
  ctx.fillText("hi-byd-arg-v2.vercel.app", PAD, CARD_H - 48);

  ctx.textAlign = "right";
  setFont(ctx, 26, 400);
  ctx.fillStyle = C.accent;
  ctx.fillText("Calculá tu carga ⚡", CARD_W - PAD, CARD_H - 48);

  ctx.letterSpacing = "0px";
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen."))),
      type,
      quality,
    );
  });
}

/** Nombre de archivo legible: hi-byd-dolphin-mini-gs.pdf */
function fileBase(modelo: string) {
  const slug = modelo
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `hi-byd-${slug}`;
}

async function ready(): Promise<void> {
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Si el navegador no resuelve fonts.ready, dibujamos igual con la fuente de sistema
    }
  }
}

export async function buildPng(data: ShareCardData): Promise<{ blob: Blob; filename: string }> {
  await ready();
  const canvas = drawShareCard(data);
  const blob = await canvasToBlob(canvas, "image/png");
  return { blob, filename: `${fileBase(data.modelo)}.png` };
}

export async function buildPdf(data: ShareCardData): Promise<{ blob: Blob; filename: string }> {
  await ready();
  const canvas = drawShareCard(data);
  // JPEG de alta calidad: un PNG de 1080x1350 genera un PDF innecesariamente pesado
  const jpeg = canvas.toDataURL("image/jpeg", 0.94);

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [CARD_W, CARD_H],
    compress: true,
  });
  doc.addImage(jpeg, "JPEG", 0, 0, CARD_W, CARD_H, undefined, "FAST");

  return { blob: doc.output("blob"), filename: `${fileBase(data.modelo)}.pdf` };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Damos margen a que arranque la descarga antes de liberar la URL
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** true si el navegador puede compartir este archivo por el share sheet nativo */
export function canShareFile(file: File): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    navigator.canShare({ files: [file] })
  );
}
