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
