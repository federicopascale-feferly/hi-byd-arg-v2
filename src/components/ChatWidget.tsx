"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { IconZap } from "./icons";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SALUDO =
  "¡Hola! Soy el asistente de Hi BYD Argentina. Preguntame sobre tiempos de carga, costos o cualquier modelo BYD.";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading, open]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      const reply: string = res.ok
        ? data.reply
        : (data.error ?? "El asistente no está disponible ahora.");
      setMessages([...history, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...history,
        { role: "assistant", content: "No pude conectarme. Revisá tu conexión y probá de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente de consultas"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-colors duration-200 hover:bg-primary-hover"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {open && (
        <section
          aria-label="Asistente de consultas"
          className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        >
          <header className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
            <IconZap width={18} height={18} className="text-accent" />
            <div>
              <p className="text-sm font-bold leading-tight">Asistente Hi BYD</p>
              <p className="text-[11px] text-muted-fg">Consultas sobre carga y modelos</p>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            <Bubble role="assistant" content={SALUDO} />
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} content={m.content} />
            ))}
            {loading && (
              <p className="text-xs text-muted-fg" role="status">
                Escribiendo…
              </p>
            )}
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-border bg-surface p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Ej: ¿cuánto tarda un Shark en Wallbox?"
              aria-label="Tu consulta"
              className="min-h-[44px] flex-1 rounded-xl border border-border bg-input-bg px-3 text-sm"
            />
            <button
              type="submit"
              disabled={loading || input.trim() === ""}
              className="min-h-[44px] cursor-pointer rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enviar
            </button>
          </form>
        </section>
      )}
    </>
  );
}

function Bubble({ role, content }: ChatMessage) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser ? "bg-primary text-on-primary" : "bg-elevated border border-border-subtle"
        }`}
      >
        {content}
      </p>
    </div>
  );
}
