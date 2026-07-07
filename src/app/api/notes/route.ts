import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { createNoteRecord } from "@/lib/notes";
import { releaseNote, reserveNote } from "@/lib/quota";
import { listNotes, toSummary } from "@/lib/store";
import { parseYoutubeId } from "@/lib/ingest/youtube";
import { processNoteInBackground, splitPlainText } from "@/lib/ingest";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const notes = await listNotes(auth.user.id);
  return NextResponse.json({ notes: notes.map(toSummary) });
}

const MAX_TEXT = 400_000;
const MAX_SEGMENTS = 20_000;
const MAX_TITLE = 160;

/**
 * Create a note from a non-file source:
 *  { kind: "youtube", url }
 *  { kind: "text", title?, text }
 *  { kind: "recording", title?, segments: [{start, end?, text}], durationSec? }
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const body = (await req.json().catch(() => null)) as {
    kind?: string;
    url?: string;
    title?: string;
    text?: string;
    folderId?: string | null;
    durationSec?: number;
    segments?: { start: number; end?: number; text: string }[];
  } | null;
  if (!body?.kind) return jsonError("Missing 'kind'.");

  const title =
    typeof body.title === "string" ? body.title.slice(0, MAX_TITLE) : undefined;

  // Validate the payload BEFORE reserving quota, so a bad request never
  // consumes a note slot.
  let build: () => Promise<{ id: string }>;

  if (body.kind === "youtube") {
    const videoId = parseYoutubeId(body.url ?? "");
    if (!videoId) {
      return jsonError(
        "That doesn't look like a valid YouTube link. Paste a URL like https://www.youtube.com/watch?v=…"
      );
    }
    build = async () => {
      const note = await createNoteRecord({
        userId: user.id,
        sourceType: "youtube",
        folderId: body.folderId,
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
        youtubeId: videoId,
      });
      return { id: note.id };
    };
  } else if (body.kind === "text") {
    const text = (body.text ?? "").trim();
    if (text.length < 20) {
      return jsonError("Please paste at least a couple of sentences.");
    }
    if (text.length > MAX_TEXT) {
      return jsonError("Text is too long (400k character max).");
    }
    build = async () => {
      const note = await createNoteRecord({
        userId: user.id,
        sourceType: "text",
        title,
        folderId: body.folderId,
        transcript: splitPlainText(text),
      });
      return { id: note.id };
    };
  } else if (body.kind === "recording") {
    const segments = (body.segments ?? [])
      .slice(0, MAX_SEGMENTS)
      .map((s) => ({
        start: Number(s.start) || 0,
        end: typeof s.end === "number" ? s.end : undefined,
        text: String(s.text ?? "")
          .slice(0, 2000)
          .trim(),
      }))
      .filter((s) => s.text.length > 0);
    if (segments.length === 0) {
      return jsonError(
        "The recording produced no transcript. Make sure your browser supports speech recognition (Chrome/Edge) and your mic is working."
      );
    }
    const total = segments.reduce((n, s) => n + s.text.length, 0);
    if (total > MAX_TEXT) {
      return jsonError("This recording's transcript is too long to save.");
    }
    build = async () => {
      const note = await createNoteRecord({
        userId: user.id,
        sourceType: "recording",
        title: title || `Recording ${new Date().toISOString().slice(0, 10)}`,
        folderId: body.folderId,
        durationSec:
          typeof body.durationSec === "number"
            ? Math.max(0, Math.min(86_400, Math.floor(body.durationSec)))
            : undefined,
        transcript: segments,
      });
      return { id: note.id };
    };
  } else {
    return jsonError(`Unknown kind '${body.kind}'.`);
  }

  // Atomically reserve the monthly quota (closes the concurrent-request race).
  if (!(await reserveNote(user))) {
    return jsonError(
      "You've reached this month's note limit on the Starter plan. Upgrade to Pro for unlimited notes.",
      403,
      "quota_exceeded"
    );
  }

  try {
    const note = await build();
    processNoteInBackground(note.id);
    return NextResponse.json({ note: { id: note.id } });
  } catch (e) {
    await releaseNote(user.id);
    throw e;
  }
}
