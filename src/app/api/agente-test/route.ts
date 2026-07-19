// Endpoint para testear el asistente desde herramientas externas de QA (ej:
// ArtificialQA). Se protege con un token propio (AGENTE_TEST_TOKEN) vía
// `Authorization: Bearer` y habla el formato OpenAI (recibe messages[],
// devuelve choices[0].message.content) para conectarse con la configuración
// por defecto de esas plataformas. Solo lectura, igual que el chat.
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
  const token = process.env.AGENTE_TEST_TOKEN;
  const auth = req.headers.get("authorization") ?? "";
  if (!token) {
    return NextResponse.json(
      { error: "Endpoint no configurado (falta AGENTE_TEST_TOKEN)." },
      { status: 503 },
    );
  }
  if (auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const messages = sanitizeMessages(
    typeof body === "object" && body !== null && "messages" in body ? body.messages : null,
  );
  if (!messages) {
    return NextResponse.json(
      { error: "sin mensajes válidos (esperado messages[] con role user/assistant y content string)" },
      { status: 400 },
    );
  }

  try {
    const reply = await responderAsistente(messages);
    return NextResponse.json({
      object: "chat.completion",
      model: "hi-byd-calculadora-asistente",
      choices: [
        {
          index: 0,
          finish_reason: "stop",
          message: { role: "assistant", content: reply },
        },
      ],
    });
  } catch (error) {
    if (error instanceof AsistenteSinConfigurar || error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "El asistente no está configurado (falta ANTHROPIC_API_KEY)." },
        { status: 503 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "rate limit del proveedor" }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error", error.status, error.message);
      return NextResponse.json({ error: "asistente no disponible" }, { status: 502 });
    }
    throw error;
  }
}
