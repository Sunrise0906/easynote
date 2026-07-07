import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { createNoteRecord } from "@/lib/notes";
import { canCreateNote, recordNoteCreated } from "@/lib/quota";
import { listNotes, toSummary } from "@/lib/store";
import { parseYoutubeId } from "@/lib/ingest/youtube";
import { processNoteInBackground, splitPlainText } from "@/lib/ingest";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const notes = await listNotes(auth.user.id);
  return NextResponse.json({ notes: notes.map(toSummary) });
}

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

  if (!canCreateNote(user)) {
    return jsonError(
      "You've reached this month's note limit on the Starter plan. Upgrade to Pro for unlimited notes.",
      403,
      "quota_exceeded"
    );
  }

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

  if (body.kind === "youtube") {
    const videoId = parseYoutubeId(body.url ?? "");
    if (!videoId) {
      return jsonError(
        "That doesn't look like a valid YouTube link. Paste a URL like https://www.youtube.com/watch?v=…"
      );
    }
    const note = await createNoteRecord({
      userId: user.id,
      sourceType: "youtube",
      folderId: body.folderId,
      sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      youtubeId: videoId,
    });
    await recordNoteCreated(user.id);
    processNoteInBackground(note.id);
    return NextResponse.json({ note: { id: note.id } });
  }

  if (body.kind === "text") {
    const text = (body.text ?? "").trim();
    if (text.length < 20) {
      return jsonError("Please paste at least a couple of sentences.");
    }
    if (text.length > 400_000) {
      return jsonError("Text is too long (400k character max).");
    }
    const note = await createNoteRecord({
      userId: user.id,
      sourceType: "text",
      title: body.title,
      folderId: body.folderId,
      transcript: splitPlainText(text),
    });
    await recordNoteCreated(user.id);
    processNoteInBackground(note.id);
    return NextResponse.json({ note: { id: note.id } });
  }

  if (body.kind === "recording") {
    const segments = (body.segments ?? [])
      .map((s) => ({
        start: Number(s.start) || 0,
        end: typeof s.end === "number" ? s.end : undefined,
        text: String(s.text ?? "").trim(),
      }))
      .filter((s) => s.text.length > 0);
    if (segments.length === 0) {
      return jsonError(
        "The recording produced no transcript. Make sure your browser supports speech recognition (Chrome/Edge) and your mic is working."
      );
    }
    const note = await createNoteRecord({
      userId: user.id,
      sourceType: "recording",
      title: body.title || `Recording ${new Date().toLocaleDateString()}`,
      folderId: body.folderId,
      durationSec: body.durationSec,
      transcript: segments,
    });
    await recordNoteCreated(user.id);
    processNoteInBackground(note.id);
    return NextResponse.json({ note: { id: note.id } });
  }

  return jsonError(`Unknown kind '${body.kind}'.`);
}
