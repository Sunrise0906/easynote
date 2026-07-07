import Anthropic from "@anthropic-ai/sdk";
import { config, visionConfigured } from "../config";
import { AiNotConfiguredError, anthropic, MODEL } from "./client";

/**
 * Provider-agnostic AI layer. Two backends:
 *  - "anthropic": the Claude SDK (structured outputs, native PDF, vision)
 *  - "openai":    any OpenAI-compatible /chat/completions endpoint
 *                 (DeepSeek, Zhipu GLM, Qwen, Kimi, MiniMax, OpenAI, Groq…)
 *
 * The rest of the app calls these functions and never touches a provider SDK
 * directly, so switching model/provider is a pure env-var change.
 */

export function aiProvider(): "anthropic" | "openai" {
  return config.ai.provider;
}

function requireOpenAI() {
  const o = config.ai.openai;
  if (!o.apiKey || !o.baseUrl || !o.model) throw new AiNotConfiguredError();
  return o;
}

/* ------------------------------------------------------------------ */
/* OpenAI-compatible primitives                                        */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
}

async function openaiChat(
  messages: ChatMessage[],
  opts: { maxTokens: number; model?: string; jsonMode?: boolean }
): Promise<string> {
  const o = requireOpenAI();
  const res = await fetch(`${o.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${o.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model || o.model,
      max_tokens: opts.maxTokens,
      messages,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as {
        error?: { message?: string } | string;
      };
      const m =
        typeof body.error === "string" ? body.error : body.error?.message;
      if (m) detail = m;
    } catch {
      /* keep status */
    }
    throw new Error(`AI request failed: ${detail}`);
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return body.choices?.[0]?.message?.content ?? "";
}

async function* openaiStream(
  messages: ChatMessage[],
  opts: { maxTokens: number; model?: string }
): AsyncGenerator<string> {
  const o = requireOpenAI();
  const res = await fetch(`${o.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${o.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model || o.model,
      max_tokens: opts.maxTokens,
      stream: true,
      messages,
    }),
  });
  if (!res.ok || !res.body) {
    let detail = `HTTP ${res.status}`;
    try {
      const b = (await res.json()) as { error?: { message?: string } };
      if (b?.error?.message) detail = b.error.message;
    } catch {
      /* keep status */
    }
    throw new Error(`AI request failed: ${detail}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        /* ignore keep-alives / partial frames */
      }
    }
  }
}

/** Pull a JSON object out of a possibly-fenced / chatty model reply. */
function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  try {
    return JSON.parse(cleaned.trim());
  } catch {
    // Fall back to the outermost { … } span.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("AI returned malformed output. Please try again.");
  }
}

/* ------------------------------------------------------------------ */
/* Public, provider-agnostic API                                       */
/* ------------------------------------------------------------------ */

/** Structured JSON generation validated against a JSON schema. */
export async function generateJSON<T>(opts: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const maxTokens = opts.maxTokens ?? 16000;

  if (aiProvider() === "anthropic") {
    const client = anthropic();
    const stream = client.messages.stream({
      model: MODEL(),
      max_tokens: maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      output_config: { format: { type: "json_schema", schema: opts.schema } },
    });
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal")
      throw new Error("The AI declined to process this content.");
    if (final.stop_reason === "max_tokens")
      throw new Error(
        "This content is too large to process in one pass. Try a shorter source or split it up."
      );
    const text = final.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    return extractJson(text) as T;
  }

  // OpenAI-compatible: schema in the prompt + json_object mode + validate.
  const system = `${opts.system}\n\nYou must respond with a single valid JSON object and nothing else — no markdown, no commentary. The JSON must conform to this schema:\n${JSON.stringify(opts.schema)}`;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await openaiChat(
      [
        { role: "system", content: system },
        { role: "user", content: opts.user },
      ],
      { maxTokens, jsonMode: true }
    );
    try {
      return extractJson(text) as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("AI returned malformed output. Please try again.");
}

/** Plain-text (non-streaming) completion. */
export async function generateText(opts: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}): Promise<string> {
  const maxTokens = opts.maxTokens ?? 8000;
  if (aiProvider() === "anthropic") {
    const client = anthropic();
    const stream = client.messages.stream({
      model: MODEL(),
      max_tokens: maxTokens,
      system: opts.system,
      messages: opts.messages as Anthropic.MessageParam[],
    });
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal")
      throw new Error("The AI declined to process this content.");
    return final.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
  }
  return openaiChat(
    [{ role: "system", content: opts.system }, ...opts.messages],
    { maxTokens }
  );
}

/** Streaming chat — yields text deltas regardless of backend. */
export async function* streamReply(opts: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}): AsyncGenerator<string> {
  const maxTokens = opts.maxTokens ?? 4000;
  if (aiProvider() === "anthropic") {
    const client = anthropic();
    const stream = client.messages.stream({
      model: MODEL(),
      max_tokens: maxTokens,
      system: opts.system,
      messages: opts.messages as Anthropic.MessageParam[],
    });
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal" || final.content.length === 0) {
      // Signal an empty/refused reply to the caller via a thrown marker.
      throw new RefusalError();
    }
    return;
  }
  yield* openaiStream(
    [{ role: "system", content: opts.system }, ...opts.messages],
    { maxTokens }
  );
}

export class RefusalError extends Error {
  refusal = true;
  constructor() {
    super("The AI declined to answer.");
  }
}

/** Extract text/content from an image (OCR). Throws if vision unavailable. */
export async function visionExtract(
  data: Buffer,
  mediaType: string,
  prompt: string
): Promise<string> {
  if (!visionConfigured()) {
    throw new Error(
      "Image reading needs a vision-capable model. Configure ANTHROPIC_API_KEY, or set AI_VISION_MODEL to a vision model (e.g. glm-4.6v, qwen3-vl-plus)."
    );
  }
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const mt = allowed.includes(mediaType) ? mediaType : "image/png";

  if (aiProvider() === "anthropic") {
    const client = anthropic();
    const stream = client.messages.stream({
      model: MODEL(),
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mt as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: data.toString("base64"),
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal")
      throw new Error("The AI declined to process this image.");
    return final.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
  }

  return openaiChat(
    [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:${mt};base64,${data.toString("base64")}` },
          },
        ],
      },
    ],
    { maxTokens: 8000, model: config.ai.openai.visionModel || undefined }
  );
}
