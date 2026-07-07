import { config, sttConfigured } from "../config";
import { TranscriptSegment } from "../store";

const STT_MAX_MB = config.stt.maxMB;

/**
 * Transcribe an uploaded audio/video file through an OpenAI-compatible
 * transcription endpoint (OpenAI whisper-1, Groq whisper-large-v3, …).
 */
export async function transcribeAudio(
  data: Buffer,
  filename: string,
  mime: string
): Promise<{ segments: TranscriptSegment[]; durationSec?: number; language?: string }> {
  if (!sttConfigured()) {
    throw new Error(
      "Speech-to-text is not configured. Add OPENAI_API_KEY (or STT_API_KEY / STT_BASE_URL / STT_MODEL for another Whisper-compatible provider) to .env.local — or use Live Recording, which transcribes in the browser without any key."
    );
  }
  if (data.length > STT_MAX_MB * 1024 * 1024) {
    throw new Error(
      `Audio file is larger than the ${STT_MAX_MB} MB transcription limit. Please compress it (e.g. export as 64 kbps mp3) and try again.`
    );
  }

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(data)], { type: mime || "application/octet-stream" }),
    filename || "audio.mp3"
  );
  form.append("model", config.stt.model);
  form.append("response_format", "verbose_json");

  const res = await fetch(`${config.stt.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.stt.apiKey}` },
    body: form,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body?.error?.message) detail = body.error.message;
    } catch {
      /* keep status */
    }
    throw new Error(`Transcription failed: ${detail}`);
  }

  const body = (await res.json()) as {
    text?: string;
    language?: string;
    duration?: number;
    segments?: { start: number; end: number; text: string }[];
  };

  let segments: TranscriptSegment[];
  if (Array.isArray(body.segments) && body.segments.length > 0) {
    segments = body.segments
      .map((s) => ({
        start: Number(s.start) || 0,
        end: Number(s.end) || undefined,
        text: String(s.text || "").trim(),
      }))
      .filter((s) => s.text.length > 0);
  } else if (body.text) {
    segments = [{ start: 0, text: body.text.trim() }];
  } else {
    throw new Error("Transcription service returned no text.");
  }

  return {
    segments,
    durationSec: body.duration ? Math.round(body.duration) : undefined,
    language: body.language,
  };
}
