import { describe, expect, it } from "vitest";
import { MAX_MESSAGE_CHARS, MAX_MESSAGES, sanitizeMessages } from "../asistente";

const user = (content: string) => ({ role: "user", content });
const assistant = (content: string) => ({ role: "assistant", content });

describe("sanitizeMessages", () => {
  it("acepta un historial user/assistant válido", () => {
    const result = sanitizeMessages([user("hola"), assistant("buenas"), user("¿cuánto tarda?")]);
    expect(result).toHaveLength(3);
    expect(result?.[2]).toEqual({ role: "user", content: "¿cuánto tarda?" });
  });

  it("rechaza vacío, no-array, roles inválidos y content no-string", () => {
    expect(sanitizeMessages([])).toBeNull();
    expect(sanitizeMessages("hola")).toBeNull();
    expect(sanitizeMessages([{ role: "system", content: "x" }])).toBeNull();
    expect(sanitizeMessages([{ role: "user", content: 42 }])).toBeNull();
    expect(sanitizeMessages([user("   ")])).toBeNull();
  });

  it("exige que el último mensaje sea del usuario y descarta un assistant inicial", () => {
    expect(sanitizeMessages([user("hola"), assistant("buenas")])).toBeNull();
    const result = sanitizeMessages([assistant("bienvenido"), user("hola")]);
    expect(result).toHaveLength(1);
    expect(result?.[0].role).toBe("user");
  });

  it("recorta el historial y el largo de cada mensaje", () => {
    const largo = sanitizeMessages([user("x".repeat(MAX_MESSAGE_CHARS + 500))]);
    expect((largo?.[0].content as string).length).toBe(MAX_MESSAGE_CHARS);

    const muchos = Array.from({ length: MAX_MESSAGES + 5 }, (_, i) =>
      i % 2 === 0 ? user(`pregunta ${i}`) : assistant(`respuesta ${i}`),
    );
    const result = sanitizeMessages(muchos);
    expect(result!.length).toBeLessThanOrEqual(MAX_MESSAGES);
    expect(result![result!.length - 1].role).toBe("user");
  });
});
