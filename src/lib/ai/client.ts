import Anthropic from "@anthropic-ai/sdk";
import { aiConfigured, config } from "../config";

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!aiConfigured()) {
    throw new AiNotConfiguredError();
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: config.anthropic.apiKey });
  }
  return _client;
}

export class AiNotConfiguredError extends Error {
  code = "ai_not_configured";
  constructor() {
    super(
      "AI is not configured. Add ANTHROPIC_API_KEY to .env.local and restart the server."
    );
  }
}

export const MODEL = () => config.anthropic.model;

/**
 * Run a structured-output request and parse the JSON response.
 * Uses streaming so long generations don't hit HTTP timeouts.
 */
export async function structuredRequest<T>(opts: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const client = anthropic();
  const stream = client.messages.stream({
    model: MODEL(),
    max_tokens: opts.maxTokens ?? 16000,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    output_config: {
      format: {
        type: "json_schema",
        schema: opts.schema,
      },
    },
  });
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") {
    throw new Error("The AI declined to process this content.");
  }
  if (final.stop_reason === "max_tokens") {
    throw new Error(
      "This content is too large to process in one pass. Try a shorter source or split it up."
    );
  }
  const text = final.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("AI returned malformed output. Please try again.");
  }
}

/** Plain-text request (no structured output). */
export async function textRequest(opts: {
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}): Promise<string> {
  const client = anthropic();
  const stream = client.messages.stream({
    model: MODEL(),
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.system,
    messages: opts.messages,
  });
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") {
    throw new Error("The AI declined to process this content.");
  }
  return final.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
}
