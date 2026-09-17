import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { extractJson, wrapUserData } from "./json";

export { wrapUserData };

/**
 * The single exit door towards the Anthropic API (section 7.3):
 *  - the key lives ONLY in process.env on the server (server-only guarantees
 *    this at build time: importing this from a client component breaks the build)
 *  - max_tokens acotado, timeout, sin retries infinitos
 *  - user text ALWAYS travels delimited as data
 *  - output validated with Zod; a single correction retry
 */

export const CLAUDE_MODEL = "claude-sonnet-4-6";

const client = new Anthropic({
  // apiKey is read from ANTHROPIC_API_KEY automatically
  timeout: 60_000,
  maxRetries: 1,
});

export class AiOutputError extends Error {
  constructor(message = "Claude did not return valid JSON after the retry") {
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
 * Calls Claude expecting ONLY JSON matching the schema. If the first
 * response does not validate, it makes ONE retry asking for a correction. If it
 * fails again, it throws AiOutputError (the caller refunds the token and answers 502).
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

  // A single retry asking for a correction
  const retryMessages: Anthropic.MessageParam[] = [
    ...messages,
    { role: "assistant", content: first || "(empty response)" },
    {
      role: "user",
      content:
        "Your previous response does not match the required JSON format. Reply with ONLY the corrected JSON object, no extra text, no markdown, matching exactly the schema given in the instructions.",
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
