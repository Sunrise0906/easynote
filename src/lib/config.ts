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
   * AI provider selection. Defaults to Anthropic (Claude). To use a cheaper
   * OpenAI-compatible provider (DeepSeek, Zhipu GLM, Qwen/DashScope, Kimi,
   * MiniMax, OpenAI, Groq, …) set:
   *   AI_PROVIDER=openai
   *   AI_BASE_URL=https://api.deepseek.com          (provider's base URL)
   *   AI_API_KEY=...                                (provider key)
   *   AI_MODEL=deepseek-v4-flash                    (text model)
   *   AI_VISION_MODEL=glm-4.6v                       (optional; enables image OCR)
   * If AI_BASE_URL + AI_API_KEY are set, "openai" mode is auto-selected.
   */
  ai: {
    provider: (process.env.AI_PROVIDER ||
      (process.env.AI_BASE_URL && process.env.AI_API_KEY
        ? "openai"
        : "anthropic")) as "anthropic" | "openai",
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

export function aiConfigured(): boolean {
  if (config.ai.provider === "openai") {
    return Boolean(config.ai.openai.apiKey && config.ai.openai.baseUrl && config.ai.openai.model);
  }
  return Boolean(config.anthropic.apiKey);
}

/** Whether the configured provider can read images (OCR). */
export function visionConfigured(): boolean {
  if (config.ai.provider === "openai") {
    return Boolean(config.ai.openai.visionModel);
  }
  return Boolean(config.anthropic.apiKey);
}

/** Whether the configured provider can read PDFs natively (Anthropic only). */
export function pdfAiConfigured(): boolean {
  return config.ai.provider === "anthropic" && Boolean(config.anthropic.apiKey);
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
