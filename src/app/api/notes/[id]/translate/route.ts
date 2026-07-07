import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { getNote, updateNote } from "@/lib/store";
import { translateNote } from "@/lib/ai/generate";
import { AiNotConfiguredError } from "@/lib/ai/client";

type Params = { params: Promise<{ id: string }> };

/** POST { language: string } — translate summary + notes, cache per language. */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
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
  if (cached && !body?.force) {
    return NextResponse.json({ translation: cached, language, cached: true });
  }

  try {
    const result = await translateNote(note, language);
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
