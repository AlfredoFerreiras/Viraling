import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { extractJson, wrapUserData } from "./json";

export { wrapUserData };

/**
 * Única puerta de salida hacia la API de Anthropic (sección 7.3):
 *  - la key vive SOLO en process.env del servidor (server-only lo garantiza
 *    en build: importar esto desde un client component rompe la compilación)
 *  - max_tokens acotado, timeout, sin retries infinitos
 *  - el texto del usuario SIEMPRE viaja delimitado como datos
 *  - salida validada con Zod; un solo reintento de corrección
 */

export const CLAUDE_MODEL = "claude-sonnet-4-6";

const client = new Anthropic({
  // apiKey se lee de ANTHROPIC_API_KEY automáticamente
  timeout: 60_000,
  maxRetries: 1,
});

export class AiOutputError extends Error {
  constructor(message = "Claude no devolvió JSON válido tras el reintento") {
    super(message);
    this.name = "AiOutputError";
  }
}

async function callOnce(
  system: string,
  messages: Anthropic.MessageParam[],
): Promise<string> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    temperature: 0.5,
    system,
    messages,
  });
  const block = response.content.find((b) => b.type === "text");
  return block?.text ?? "";
}

/**
 * Llama a Claude esperando SOLO JSON conforme al schema. Si la primera
 * respuesta no valida, hace UN reintento pidiendo la corrección. Si vuelve
 * a fallar, lanza AiOutputError (el caller reembolsa el token y responde 502).
 */
export async function callClaudeJson<T extends z.ZodType>(opts: {
  system: string;
  user: string;
  schema: T;
}): Promise<z.infer<T>> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: opts.user },
  ];

  const first = await callOnce(opts.system, messages);
  const firstJson = extractJson(first);
  if (firstJson !== null) {
    const parsed = opts.schema.safeParse(firstJson);
    if (parsed.success) return parsed.data;
  }

  // Un solo reintento pidiendo corrección
  const retryMessages: Anthropic.MessageParam[] = [
    ...messages,
    { role: "assistant", content: first || "(respuesta vacía)" },
    {
      role: "user",
      content:
        "Tu respuesta anterior no cumple el formato JSON requerido. Responde ÚNICAMENTE el objeto JSON corregido, sin texto adicional, sin markdown, cumpliendo exactamente el schema indicado en las instrucciones.",
    },
  ];
  const second = await callOnce(opts.system, retryMessages);
  const secondJson = extractJson(second);
  if (secondJson !== null) {
    const parsed = opts.schema.safeParse(secondJson);
    if (parsed.success) return parsed.data;
  }

  throw new AiOutputError();
}
