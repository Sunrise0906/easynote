import fsp from "fs/promises";
import path from "path";
import { aiConfigured } from "../config";
import {
  Note,
  TranscriptSegment,
  getNote,
  updateNote,
  uploadsDir,
} from "../store";
import {
  extractFromImage,
  extractFromPdfViaClaude,
  generateNoteContent,
} from "../ai/generate";
import { extractPdfText } from "./pdf";
import { transcribeAudio } from "./audio";
import { fetchYoutubeTranscript } from "./youtube";

async function setStage(
  id: string,
  patch: Partial<Pick<Note, "status" | "statusMessage" | "progress" | "error">>
) {
  await updateNote(id, (n) => Object.assign(n, patch));
}

async function readMedia(note: Note): Promise<Buffer> {
  if (!note.mediaFile) throw new Error("No uploaded file found for this note.");
  return fsp.readFile(path.join(uploadsDir(), note.mediaFile));
}

/**
 * Acquire the transcript for a note based on its source type.
 * Mutates nothing — returns the transcript data.
 */
async function acquireTranscript(note: Note): Promise<{
  segments: TranscriptSegment[];
  durationSec?: number;
  title?: string;
}> {
  switch (note.sourceType) {
    case "youtube": {
      if (!note.youtubeId) throw new Error("Missing YouTube video id.");
      const info = await fetchYoutubeTranscript(note.youtubeId);
      return {
        segments: info.segments,
        durationSec: info.durationSec,
        title: info.title,
      };
    }
    case "pdf": {
      const data = await readMedia(note);
      const { segments, totalChars } = await extractPdfText(data);
      if (totalChars >= 200) return { segments };
      // Nearly no embedded text — probably a scanned PDF. Let Claude read it.
      if (!aiConfigured()) {
        throw new Error(
          "This PDF appears to be scanned (no embedded text). Configure ANTHROPIC_API_KEY so the AI can read it."
        );
      }
      const text = await extractFromPdfViaClaude(data);
      return { segments: splitPlainText(text) };
    }
    case "image": {
      const data = await readMedia(note);
      const text = await extractFromImage(data, note.mediaMime || "image/png");
      if (!text.trim()) throw new Error("No readable content in this image.");
      return { segments: splitPlainText(text) };
    }
    case "audio":
    case "video": {
      const data = await readMedia(note);
      const result = await transcribeAudio(
        data,
        note.mediaFile || "audio",
        note.mediaMime || "audio/mpeg"
      );
      return { segments: result.segments, durationSec: result.durationSec };
    }
    case "text":
    case "recording":
      // Transcript was provided at creation time.
      return { segments: note.transcript };
    default:
      throw new Error(`Unsupported source type: ${note.sourceType}`);
  }
}

/** Split pasted/extracted plain text into paragraph segments. */
export function splitPlainText(text: string): TranscriptSegment[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks = paragraphs.length > 0 ? paragraphs : [text.trim()];
  return chunks.map((p, i) => ({ start: i, text: p }));
}

/**
 * Full processing pipeline for a note. Runs in the background
 * (fire-and-forget from the API route); every stage persists progress
 * so the client can poll `/api/notes/:id/status`.
 */
export async function processNote(noteId: string): Promise<void> {
  const note = await getNote(noteId);
  if (!note) return;

  try {
    /* -------- stage 1: transcript ------------------------------ */
    const needsTranscript =
      note.sourceType !== "text" && note.sourceType !== "recording";
    if (needsTranscript || note.transcript.length === 0) {
      await setStage(noteId, {
        status: "transcribing",
        statusMessage:
          note.sourceType === "youtube"
            ? "Fetching video transcript…"
            : note.sourceType === "pdf"
              ? "Extracting document text…"
              : note.sourceType === "image"
                ? "Reading the image…"
                : "Transcribing audio…",
        progress: 15,
        error: undefined,
      });
    }
    const acquired = await acquireTranscript(note);
    if (acquired.segments.length === 0) {
      throw new Error("No content could be extracted from this source.");
    }
    await updateNote(noteId, (n) => {
      n.transcript = acquired.segments;
      if (acquired.durationSec) n.durationSec = acquired.durationSec;
      if (acquired.title && (n.title === "Untitled note" || !n.title)) {
        n.title = acquired.title;
      }
      n.progress = 45;
    });

    /* -------- stage 2: AI notes -------------------------------- */
    if (!aiConfigured()) {
      // Without an API key we still keep the transcript usable.
      await setStage(noteId, {
        status: "ready",
        statusMessage:
          "Transcript ready. Add ANTHROPIC_API_KEY to unlock AI notes, flashcards, quizzes and chat.",
        progress: 100,
      });
      return;
    }

    await setStage(noteId, {
      status: "generating",
      statusMessage: "Writing your AI notes…",
      progress: 55,
    });

    const fresh = await getNote(noteId);
    if (!fresh) return;
    const generated = await generateNoteContent(fresh);

    await updateNote(noteId, (n) => {
      n.title =
        n.sourceType === "youtube" && n.title !== "Untitled note"
          ? n.title // keep the real video title
          : generated.title || n.title;
      n.emoji = generated.emoji || n.emoji;
      n.language = generated.language;
      n.summary = generated.summary;
      n.keyPoints = generated.keyPoints;
      n.notesMarkdown = generated.notesMarkdown;
      n.status = "ready";
      n.statusMessage = undefined;
      n.progress = 100;
      n.error = undefined;
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    await setStage(noteId, {
      status: "error",
      statusMessage: undefined,
      error: message,
      progress: 0,
    });
  }
}

/** Fire the pipeline without awaiting it (API routes return immediately). */
export function processNoteInBackground(noteId: string): void {
  void processNote(noteId).catch(() => {
    /* processNote handles its own errors */
  });
}

/** How long a note may sit in a processing state before we call it stuck. */
const STALE_PROCESSING_MS = 15 * 60 * 1000;

/**
 * If a note was mid-processing when the server restarted, it would stay
 * "transcribing"/"generating" forever. Called from read paths: flips such
 * notes to an error state with a retry hint. Returns the (possibly updated)
 * note.
 */
export async function reconcileStaleProcessing(note: Note): Promise<Note> {
  const processing =
    note.status === "pending" ||
    note.status === "transcribing" ||
    note.status === "generating";
  if (!processing) return note;
  if (Date.now() - note.updatedAt < STALE_PROCESSING_MS) return note;
  const updated = await updateNote(note.id, (n) => {
    n.status = "error";
    n.statusMessage = undefined;
    n.error =
      "Processing was interrupted (the server restarted). Hit “Try again” to reprocess this note.";
    n.progress = 0;
  });
  return updated ?? note;
}
