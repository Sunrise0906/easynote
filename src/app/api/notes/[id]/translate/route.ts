import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { getNote, updateNote } from "@/lib/store";
import { translateNote } from "@/lib/ai/generate";
import { AiNotConfiguredError } from "@/lib/ai/client";
import { rateLimit } from "@/lib/ratelimit";

type Params = { params: Promise<{ id: string }> };

const MAX_STORED_TRANSLATIONS = 20;

/** POST { language: string } — translate summary + notes, cache per language. */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  if (!rateLimit(`ai:tr:${auth.user.id}`, 40, 60 * 60 * 1000)) {
    return jsonError(
      "You're translating very fast — please wait a minute and try again.",
      429
    );
  }
  const { id } = await params;
  const note = await getNote(id);
  if (!note || note.userId !== auth.user.id) {
    return jsonError("Note not found.", 404);
  }
  if (!note.notesMarkdown) {
    return jsonError("Generate notes first, then translate them.", 409);
  }

  const body = (await req.json().catch(() => null)) as {
    language?: string;
    force?: boolean;
  } | null;
  const language = body?.language?.trim();
  if (!language || language.length > 40) {
    return jsonError("Missing target language.");
  }

  const cached = note.translations[language];
  // Free plans can't force a cache-busting re-translation (cost control).
  const force = body?.force && auth.user.plan !== "free";
  if (cached && !force) {
    return NextResponse.json({ translation: cached, language, cached: true });
  }
  if (
    !cached &&
    Object.keys(note.translations).length >= MAX_STORED_TRANSLATIONS
  ) {
    return jsonError(
      "This note already has the maximum number of stored translations.",
      409
    );
  }

  try {
    const result = await translateNote(note, language, auth.user.modelId);
    const translation = {
      summary: result.summary,
      notesMarkdown: result.notesMarkdown,
      updatedAt: Date.now(),
    };
    await updateNote(id, (n) => {
      n.translations[language] = translation;
    });
    return NextResponse.json({ translation, language, cached: false });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return jsonError(err.message, 503, err.code);
    }
    return jsonError(
      err instanceof Error ? err.message : "Translation failed.",
      500
    );
  }
}
