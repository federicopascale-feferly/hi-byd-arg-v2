// Núcleo del asistente, compartido por /api/chat (la burbuja de la web) y
// /api/agente-test (QA externo, ej. ArtificialQA). Acá vive todo lo que no
// depende del transporte: sanitización, llamada a Claude y manejo de refusals.
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./systemPrompt";

export const MAX_MESSAGES = 20;
export const MAX_MESSAGE_CHARS = 1500;

const SYSTEM_PROMPT = buildSystemPrompt();

/** El server no tiene ANTHROPIC_API_KEY configurada. */
export class AsistenteSinConfigurar extends Error {}

export const RESPUESTA_RECHAZO =
  "No puedo ayudarte con eso. Preguntame sobre carga, costos o modelos BYD.";

export function sanitizeMessages(raw: unknown): Anthropic.MessageParam[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const messages: Anthropic.MessageParam[] = [];
  for (const m of raw.slice(-MAX_MESSAGES)) {
    if (
      typeof m !== "object" ||
      m === null ||
      !("role" in m) ||
      !("content" in m) ||
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string" ||
      m.content.trim() === ""
    ) {
      return null;
    }
    messages.push({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) });
  }
  if (messages[0].role !== "user") messages.shift();
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") return null;
  return messages;
}

/**
 * Llama a Claude con el historial ya sanitizado y devuelve la respuesta.
 * Los errores de la API de Anthropic (RateLimitError, etc.) suben tal cual:
 * cada route handler los traduce a su propio formato de respuesta.
 */
export async function responderAsistente(messages: Anthropic.MessageParam[]): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new AsistenteSinConfigurar();

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  });

  const reply = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (response.stop_reason === "refusal" || reply === "") return RESPUESTA_RECHAZO;
  return reply;
}
