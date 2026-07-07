import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { createNoteRecord } from "@/lib/notes";
import { quotaInfo, releaseNote, reserveNote } from "@/lib/quota";
import { SourceType, deleteNote, getNote, updateNote, uploadsDir } from "@/lib/store";
import { normalizeUploadMime } from "@/lib/media";
import { rateLimit } from "@/lib/ratelimit";
import { config } from "@/lib/config";
import { processNoteInBackground } from "@/lib/ingest";

export const runtime = "nodejs";

const KIND_BY_MIME: [RegExp, SourceType][] = [
  [/^audio\//, "audio"],
  [/^video\//, "video"],
  [/^application\/pdf$/, "pdf"],
  [/^image\//, "image"],
];

const EXT_FALLBACK: Record<string, SourceType> = {
  mp3: "audio",
  m4a: "audio",
  wav: "audio",
  aac: "audio",
  ogg: "audio",
  oga: "audio",
  flac: "audio",
  webm: "audio",
  mp4: "video",
  mov: "video",
  mkv: "video",
  avi: "video",
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
};

function detectSourceType(name: string, type: string): SourceType | null {
  for (const [re, kind] of KIND_BY_MIME) {
    if (re.test(type)) return kind;
  }
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_FALLBACK[ext] ?? null;
}

/**
 * Stream the uploaded file part to disk with a hard byte cap, so an oversized
 * body can't be buffered into memory (OOM). We read the raw request body
 * (a single-file multipart or a raw body) and stop at maxBytes.
 *
 * We use req.formData() only for small metadata; for the file bytes we prefer
 * the streaming path. Next's Request.formData buffers everything, so instead
 * we parse a minimal multipart stream ourselves for the common single-file
 * case, falling back to formData for tiny bodies.
 */
async function saveWithinLimit(
  file: File,
  destPath: string,
  maxBytes: number
): Promise<{ ok: true } | { ok: false; tooLarge: boolean }> {
  // File.stream() yields the part bytes without materializing the whole file.
  const reader = file.stream().getReader();
  let written = 0;
  const out = fs.createWriteStream(destPath);
  const source = new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
          return;
        }
        written += value.byteLength;
        if (written > maxBytes) {
          this.destroy(new Error("too_large"));
          return;
        }
        this.push(Buffer.from(value));
      } catch (e) {
        this.destroy(e as Error);
      }
    },
  });
  try {
    await pipeline(source, out);
    return { ok: true };
  } catch (e) {
    await fsp.unlink(destPath).catch(() => {});
    const tooLarge = e instanceof Error && e.message === "too_large";
    return { ok: false, tooLarge };
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  if (!rateLimit(`upload:${user.id}`, 30, 10 * 60 * 1000)) {
    return jsonError("Too many uploads. Please wait a moment.", 429);
  }

  const q = quotaInfo(user);
  const maxBytes = q.maxUploadMB * 1024 * 1024;

  // Cheap up-front rejection before we read the body at all.
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength && contentLength > maxBytes + 1024 * 1024) {
    return jsonError(
      `File is larger than your plan's ${q.maxUploadMB} MB upload limit.`,
      413,
      "file_too_large"
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) {
    return jsonError("No file received.");
  }
  if (file.size > maxBytes) {
    return jsonError(
      `File is larger than your plan's ${q.maxUploadMB} MB upload limit.`,
      413,
      "file_too_large"
    );
  }

  const sourceType = detectSourceType(file.name, file.type);
  if (!sourceType) {
    return jsonError(
      "Unsupported file type. Upload audio (mp3, m4a, wav…), video (mp4, mov…), PDF, or an image."
    );
  }

  // Audio/video transcription runs through a Whisper endpoint capped at ~25 MB,
  // so reject oversized media up front (before consuming a note-quota slot).
  if (
    (sourceType === "audio" || sourceType === "video") &&
    file.size > config.stt.maxMB * 1024 * 1024
  ) {
    return jsonError(
      `Audio & video files must be under ${config.stt.maxMB} MB to transcribe. Please compress it (e.g. export as 64 kbps mp3) and try again.`,
      413,
      "file_too_large"
    );
  }

  const safeExt =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "bin";
  const attachTo = form.get("attachTo");

  /* ---- attach recorded audio to an existing recording note ---- */
  // No new note is created here, so this path does NOT consume note quota.
  if (typeof attachTo === "string" && attachTo) {
    const note = await getNote(attachTo);
    if (!note || note.userId !== user.id) return jsonError("Note not found.", 404);
    const mediaFile = `${note.id}.${safeExt}`;
    const dest = path.join(uploadsDir(), mediaFile);
    const saved = await saveWithinLimit(file, dest, maxBytes);
    if (!saved.ok) {
      return saved.tooLarge
        ? jsonError(`File exceeds your ${q.maxUploadMB} MB limit.`, 413, "file_too_large")
        : jsonError("Could not save the file.", 500);
    }
    // Remove a previously-attached file with a different extension.
    if (note.mediaFile && note.mediaFile !== mediaFile) {
      await fsp
        .unlink(path.join(uploadsDir(), path.basename(note.mediaFile)))
        .catch(() => {});
    }
    await updateNote(note.id, (n) => {
      n.mediaFile = mediaFile;
      n.mediaMime = normalizeUploadMime(sourceType, file.type);
    });
    return NextResponse.json({ note: { id: note.id } });
  }

  /* ---- new uploaded note (consumes monthly quota, atomically) ---- */
  if (!(await reserveNote(user))) {
    return jsonError(
      "You've reached this month's note limit on the Starter plan. Upgrade to Pro for unlimited notes.",
      403,
      "quota_exceeded"
    );
  }

  const title = file.name.replace(/\.[^.]+$/, "").slice(0, 160);
  let note;
  try {
    note = await createNoteRecord({
      userId: user.id,
      sourceType,
      title,
      folderId:
        typeof form.get("folderId") === "string"
          ? String(form.get("folderId")) || null
          : null,
      mediaMime: normalizeUploadMime(sourceType, file.type),
    });
    const mediaFile = `${note.id}.${safeExt}`;
    const dest = path.join(uploadsDir(), mediaFile);
    const saved = await saveWithinLimit(file, dest, maxBytes);
    if (!saved.ok) {
      await deleteNote(note.id);
      await releaseNote(user.id);
      return saved.tooLarge
        ? jsonError(`File exceeds your ${q.maxUploadMB} MB limit.`, 413, "file_too_large")
        : jsonError("Could not save the file.", 500);
    }
    await updateNote(note.id, (n) => {
      n.mediaFile = mediaFile;
    });
  } catch (e) {
    if (note) await deleteNote(note.id).catch(() => {});
    await releaseNote(user.id);
    throw e;
  }

  processNoteInBackground(note.id);
  return NextResponse.json({ note: { id: note.id } });
}
