import Anthropic from "@anthropic-ai/sdk";
import { AiNotConfiguredError, anthropic } from "./client";
import {
  ModelDef,
  ThinkStripper,
  resolveModel,
  stripThink,
} from "./models";

/**
 * Provider-agnostic AI layer. Routes each call to the user's selected model
 * (Claude, GLM-5.2, MiniMax-M3, or a custom OpenAI-compatible model) and
 * smooths over reasoning-model quirks (Zhipu's thinking param, MiniMax's
 * inline <think> tags).
 */

function pick(modelId?: string | null): ModelDef {
  const m = resolveModel(modelId);
  if (!m) throw new AiNotConfiguredError();
  return m;
}

export class RefusalError extends Error {
  refusal = true;
  constructor() {
    super("The AI declined to answer.");
  }
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

function openaiBody(
  m: ModelDef,
  messages: ChatMessage[],
  opts: { maxTokens: number; model?: string; jsonMode?: boolean; stream?: boolean }
) {
  // Reasoning models eat output budget; give inline-tag models headroom.
  const maxTokens =
    m.think === "inline-tag" ? Math.round(opts.maxTokens * 1.6) : opts.maxTokens;
  const body: Record<string, unknown> = {
    model: opts.model || m.model,
    max_tokens: maxTokens,
    messages,
  };
  if (opts.stream) body.stream = true;
  if (opts.jsonMode) body.response_format = { type: "json_object" };
  // Suppress reasoning where the provider supports a flag.
  if (m.think === "zhipu-param") body.thinking = { type: "disabled" };
  return body;
}

async function openaiChat(
  m: ModelDef,
  messages: ChatMessage[],
  opts: { maxTokens: number; model?: string; jsonMode?: boolean }
): Promise<string> {
  const res = await fetch(`${m.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${m.apiKey}`,
    },
    body: JSON.stringify(openaiBody(m, messages, opts)),
  });
  if (!res.ok) {
    throw new Error(`AI request failed: ${await errorDetail(res)}`);
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  let text = body.choices?.[0]?.message?.content ?? "";
  if (m.think === "inline-tag") text = stripThink(text);
  return text;
}

async function* openaiStream(
  m: ModelDef,
  messages: ChatMessage[],
  opts: { maxTokens: number }
): AsyncGenerator<string> {
  const res = await fetch(`${m.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${m.apiKey}`,
    },
    body: JSON.stringify(openaiBody(m, messages, { ...opts, stream: true })),
  });
  if (!res.ok || !res.body) {
    throw new Error(`AI request failed: ${await errorDetail(res)}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const stripper = m.think === "inline-tag" ? new ThinkStripper() : null;
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
        if (delta) {
          const out = stripper ? stripper.feed(delta) : delta;
          if (out) yield out;
        }
      } catch {
        /* ignore keep-alives / partial frames */
      }
    }
  }
}

async function errorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as {
      error?: { message?: string } | string;
      base_resp?: { status_msg?: string };
    };
    const m =
      typeof body.error === "string"
        ? body.error
        : body.error?.message || body.base_resp?.status_msg;
    if (m) return m;
  } catch {
    /* ignore */
  }
  return `HTTP ${res.status}`;
}

/** Pull a JSON object out of a possibly-fenced / chatty model reply. */
function extractJson(text: string): unknown {
  const cleaned = stripThink(text)
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "");
  try {
    return JSON.parse(cleaned.trim());
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("AI returned malformed output. Please try again.");
  }
}

/* ------------------------------------------------------------------ */
/* Anthropic helpers                                                   */
/* ------------------------------------------------------------------ */

function anthropicText(final: Anthropic.Message): string {
  return final.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
}

/* ------------------------------------------------------------------ */
/* Public, model-agnostic API                                          */
/* ------------------------------------------------------------------ */

export async function generateJSON<T>(opts: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
  modelId?: string | null;
}): Promise<T> {
  const m = pick(opts.modelId);
  const maxTokens = opts.maxTokens ?? 16000;

  if (m.provider === "anthropic") {
    const stream = anthropic().messages.stream({
      model: m.model,
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
    return extractJson(anthropicText(final)) as T;
  }

  const noThink =
    m.think === "inline-tag"
      ? " Do not include any reasoning or <think> blocks — output only the JSON object."
      : "";
  const system = `${opts.system}\n\nRespond with a single valid JSON object and nothing else — no markdown, no commentary.${noThink} The JSON must conform to this schema:\n${JSON.stringify(opts.schema)}`;
  // json_object mode makes MiniMax-class (inline-tag) models intermittently
  // return empty content on large generations; they ignore the flag anyway
  // and extractJson handles their <think>+fenced output, so skip it for them.
  const jsonMode = m.think !== "inline-tag";
  // Reasoning models occasionally return empty content; retry a few times.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const text = await openaiChat(
      m,
      [
        { role: "system", content: system },
        { role: "user", content: opts.user },
      ],
      { maxTokens, jsonMode }
    );
    if (text.trim().length === 0) {
      lastErr = new Error("The AI returned an empty response.");
      continue;
    }
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

export async function* streamReply(opts: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  modelId?: string | null;
}): AsyncGenerator<string> {
  const m = pick(opts.modelId);
  const maxTokens = opts.maxTokens ?? 4000;

  if (m.provider === "anthropic") {
    const stream = anthropic().messages.stream({
      model: m.model,
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
      throw new RefusalError();
    }
    return;
  }

  yield* openaiStream(
    m,
    [{ role: "system", content: opts.system }, ...opts.messages],
    { maxTokens }
  );
}

/** Extract text/content from an image (OCR). Throws if the model lacks vision. */
export async function visionExtract(
  data: Buffer,
  mediaType: string,
  prompt: string,
  modelId?: string | null
): Promise<string> {
  const m = pick(modelId);
  if (!m.visionModel) {
    throw new Error(
      `The selected model (${m.label}) can't read images. Pick a vision-capable model in Settings.`
    );
  }
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const mt = allowed.includes(mediaType) ? mediaType : "image/png";

  if (m.provider === "anthropic") {
    const stream = anthropic().messages.stream({
      model: m.visionModel,
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
    return anthropicText(final);
  }

  return openaiChat(
    m,
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
    { maxTokens: 8000, model: m.visionModel }
  );
}
