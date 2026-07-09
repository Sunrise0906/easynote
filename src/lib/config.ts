import path from "path";

/** Central runtime configuration, resolved from environment variables. */
export const config = {
  dataDir: process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(process.cwd(), "data"),

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
  },

  /**
   * AI models. Any model whose API key is present becomes selectable in
   * Settings. Built-in options:
   *   ANTHROPIC_API_KEY  → Claude (best quality; only one that reads scanned PDFs)
   *   ZHIPU_API_KEY      → GLM-5.2 (cheap, vision via glm-4.6v-flash)
   *   MINIMAX_API_KEY    → MiniMax-M3 (cheap, multimodal)
   * Plus a generic OpenAI-compatible escape hatch (DeepSeek/Qwen/Kimi/OpenAI…):
   *   AI_BASE_URL + AI_API_KEY + AI_MODEL (+ optional AI_VISION_MODEL)
   * AI_DEFAULT_MODEL picks the default when several are configured.
   */
  ai: {
    // Default model for FREE users (must be a free-tier model).
    defaultModel: process.env.AI_DEFAULT_MODEL || "",
    // Default model for PRO users (falls back to defaultModel).
    proDefaultModel: process.env.AI_PRO_DEFAULT_MODEL || "",
    // Model ids that require the Pro plan (comma-separated). Everything else
    // is available to the free plan. Default: the paid models are Pro-only so
    // free users can't drain the operator's paid API keys.
    proModels: (process.env.AI_PRO_MODELS ?? "minimax-m3,glm-5.2")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    keys: {
      zhipu: process.env.ZHIPU_API_KEY || "",
      minimax: process.env.MINIMAX_API_KEY || "",
    },
    openai: {
      apiKey: process.env.AI_API_KEY || "",
      baseUrl: (process.env.AI_BASE_URL || "").replace(/\/$/, ""),
      model: process.env.AI_MODEL || "",
      visionModel: process.env.AI_VISION_MODEL || "",
    },
  },

  /**
   * Speech-to-text for uploaded audio/video files. Any OpenAI-compatible
   * transcription endpoint works (OpenAI whisper-1, Groq whisper-large-v3, …).
   * Live recording in the browser does NOT need this — it uses the Web Speech API.
   */
  stt: {
    apiKey: process.env.STT_API_KEY || process.env.OPENAI_API_KEY || "",
    baseUrl: (
      process.env.STT_BASE_URL || "https://api.openai.com/v1"
    ).replace(/\/$/, ""),
    model: process.env.STT_MODEL || "whisper-1",
    // Whisper-compatible endpoints cap uploads at 25 MB. Audio/video files are
    // rejected above this regardless of plan, so users fail fast.
    maxMB: Number(process.env.STT_MAX_MB || 25),
  },

  session: {
    cookieName: "en_session",
    maxAgeDays: 30,
  },
};

/** Public base URL of this deployment (used for SEO metadata + share links). */
export function appUrl(): string {
  const raw =
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    (process.env.FLY_APP_NAME
      ? `https://${process.env.FLY_APP_NAME}.fly.dev`
      : "") ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

/** True if at least one AI model is configured (any provider key present). */
export function aiConfigured(): boolean {
  return Boolean(
    config.anthropic.apiKey ||
      config.ai.keys.zhipu ||
      config.ai.keys.minimax ||
      (config.ai.openai.apiKey && config.ai.openai.baseUrl && config.ai.openai.model)
  );
}

/** True if any configured model can read images (OCR). */
export function visionConfigured(): boolean {
  return Boolean(
    config.anthropic.apiKey ||
      config.ai.keys.zhipu ||
      config.ai.keys.minimax ||
      config.ai.openai.visionModel
  );
}

/** Native scanned-PDF reading is Anthropic-only. */
export function pdfAiConfigured(): boolean {
  return Boolean(config.anthropic.apiKey);
}

export function sttConfigured(): boolean {
  return Boolean(config.stt.apiKey);
}

export type PlanId = "free" | "pro";

export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    name: string;
    notesPerMonth: number;
    chatPerDay: number;
    maxUploadMB: number;
    flashcardsPerNote: number;
    quizPerNote: number;
  }
> = {
  free: {
    id: "free",
    name: "Starter",
    notesPerMonth: 10,
    chatPerDay: 30,
    maxUploadMB: 25,
    flashcardsPerNote: 10,
    quizPerNote: 5,
  },
  pro: {
    id: "pro",
    name: "Pro",
    notesPerMonth: 1000,
    chatPerDay: 1000,
    maxUploadMB: 200,
    flashcardsPerNote: 20,
    quizPerNote: 10,
  },
};

export const PRICING = {
  monthly: 19.99,
  yearlyPerMonth: 8.39,
  yearlyTotal: 100.68,
};
