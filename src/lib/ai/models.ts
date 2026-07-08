import { config } from "../config";

/**
 * Catalog of selectable AI models. A model appears only when its API key is
 * configured. Users pick one in Settings (stored on their account); the chosen
 * model routes every generation for that user.
 */

export type ThinkStyle =
  // no reasoning tokens
  | "none"
  // Zhipu-style: send `thinking:{type:"disabled"}` to suppress reasoning
  | "zhipu-param"
  // MiniMax-style: reasoning leaks into content as <think>…</think>; strip it
  | "inline-tag";

export interface ModelDef {
  id: string;
  label: string;
  provider: "anthropic" | "openai";
  model: string;
  baseUrl?: string; // openai-compatible base URL
  apiKey: string;
  /** Model used for image OCR; empty string = this model can't read images. */
  visionModel: string;
  /** Native scanned-PDF reading (Anthropic only). */
  pdf: boolean;
  think: ThinkStyle;
  blurb: string;
}

export function catalog(): ModelDef[] {
  const models: ModelDef[] = [];

  if (config.anthropic.apiKey) {
    models.push({
      id: "claude",
      label: `Claude (${config.anthropic.model})`,
      provider: "anthropic",
      model: config.anthropic.model,
      apiKey: config.anthropic.apiKey,
      visionModel: config.anthropic.model,
      pdf: true,
      think: "none",
      blurb: "Best quality. Reads images and scanned PDFs natively.",
    });
  }
  if (config.ai.keys.zhipu) {
    models.push({
      id: "glm-5.2",
      label: "Zhipu GLM-5.2",
      provider: "openai",
      baseUrl: "https://open.bigmodel.cn/api/paas/v4",
      model: "glm-5.2",
      apiKey: config.ai.keys.zhipu,
      visionModel: "glm-4.6v-flash",
      pdf: false,
      think: "zhipu-param",
      blurb: "Cheap & fast, China-hosted. Reads images (no scanned PDFs).",
    });
  }
  if (config.ai.keys.minimax) {
    models.push({
      id: "minimax-m3",
      label: "MiniMax-M3",
      provider: "openai",
      baseUrl: "https://api.minimaxi.com/v1",
      model: "MiniMax-M3",
      apiKey: config.ai.keys.minimax,
      visionModel: "MiniMax-M3",
      pdf: false,
      think: "inline-tag",
      blurb: "Cheap, China-hosted, multimodal. Reads images (no scanned PDFs).",
    });
  }
  // Generic OpenAI-compatible escape hatch (DeepSeek, Qwen, Kimi, OpenAI…).
  const o = config.ai.openai;
  if (o.apiKey && o.baseUrl && o.model) {
    models.push({
      id: "custom",
      label: `${o.model} (custom)`,
      provider: "openai",
      baseUrl: o.baseUrl,
      model: o.model,
      apiKey: o.apiKey,
      visionModel: o.visionModel,
      pdf: false,
      think: "none",
      blurb: "Custom OpenAI-compatible model configured via AI_BASE_URL.",
    });
  }
  return models;
}

/** Public (no secrets) view of the available models, for the client. */
export function publicModels(): { id: string; label: string; blurb: string; vision: boolean }[] {
  return catalog().map((m) => ({
    id: m.id,
    label: m.label,
    blurb: m.blurb,
    vision: Boolean(m.visionModel),
  }));
}

export function defaultModelId(): string | null {
  const list = catalog();
  if (list.length === 0) return null;
  const pref = config.ai.defaultModel;
  if (pref && list.some((m) => m.id === pref)) return pref;
  return list[0].id;
}

/** Resolve a user's chosen model id to a concrete config, with fallback. */
export function resolveModel(preferredId?: string | null): ModelDef | null {
  const list = catalog();
  if (list.length === 0) return null;
  if (preferredId) {
    const hit = list.find((m) => m.id === preferredId);
    if (hit) return hit;
  }
  const def = defaultModelId();
  return list.find((m) => m.id === def) ?? list[0];
}

/** Strip MiniMax-style <think>…</think> reasoning blocks from text. */
export function stripThink(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

/**
 * Streaming filter that suppresses <think>…</think> spans across chunk
 * boundaries. feed() returns only the emittable (non-reasoning) text.
 */
export class ThinkStripper {
  private buf = "";
  private inThink = false;

  feed(chunk: string): string {
    this.buf += chunk;
    let out = "";
    for (;;) {
      if (!this.inThink) {
        const open = this.buf.indexOf("<think>");
        if (open === -1) {
          // Emit everything except a possible partial "<think>" tail.
          const safe = this.holdBack(this.buf, "<think>");
          out += this.buf.slice(0, safe);
          this.buf = this.buf.slice(safe);
          break;
        }
        out += this.buf.slice(0, open);
        this.buf = this.buf.slice(open + 7);
        this.inThink = true;
      } else {
        const close = this.buf.indexOf("</think>");
        if (close === -1) {
          // Keep only a possible partial "</think>" tail; drop the rest.
          const safe = this.holdBack(this.buf, "</think>");
          this.buf = this.buf.slice(safe);
          break;
        }
        this.buf = this.buf.slice(close + 8);
        this.inThink = false;
      }
    }
    return out;
  }

  /** Index up to which `s` is safe to consume without splitting `tag`. */
  private holdBack(s: string, tag: string): number {
    for (let k = Math.min(tag.length - 1, s.length); k > 0; k--) {
      if (s.endsWith(tag.slice(0, k))) return s.length - k;
    }
    return s.length;
  }
}
