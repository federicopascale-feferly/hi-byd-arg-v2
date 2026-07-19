import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  AsistenteSinConfigurar,
  responderAsistente,
  sanitizeMessages,
} from "@/lib/chat/asistente";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const messages = sanitizeMessages(
    typeof body === "object" && body !== null && "messages" in body ? body.messages : null,
  );
  if (!messages) {
    return NextResponse.json({ error: "Mensajes inválidos." }, { status: 400 });
  }

  try {
    const reply = await responderAsistente(messages);
    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof AsistenteSinConfigurar) {
      return NextResponse.json(
        { error: "El asistente todavía no está configurado." },
        { status: 503 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Mucha demanda en este momento. Probá de nuevo en un minuto." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "El asistente todavía no está configurado." },
        { status: 503 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error", error.status, error.message);
      return NextResponse.json(
        { error: "El asistente no está disponible ahora. Probá más tarde." },
        { status: 502 },
      );
    }
    throw error;
  }
}
