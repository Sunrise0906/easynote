import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { getNote, updateNote } from "@/lib/store";
import {
  generateFlashcards,
  generateNoteContent,
  generateQuiz,
} from "@/lib/ai/generate";
import { AiNotConfiguredError } from "@/lib/ai/client";
import { PLANS } from "@/lib/config";
import { rateLimit } from "@/lib/ratelimit";

type Params = { params: Promise<{ id: string }> };

/**
 * POST { kind: "flashcards" | "quiz" | "notes" }
 * Generates the requested study artifact for a ready note.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  // Each call is an expensive Claude request billed to the deployment's key —
  // bound per-user spend (not spoofable, keyed on the account).
  if (!rateLimit(`ai:gen:${auth.user.id}`, 60, 60 * 60 * 1000)) {
    return jsonError(
      "You're generating study material very fast — please wait a minute and try again.",
      429
    );
  }
  const { id } = await params;
  const note = await getNote(id);
  if (!note || note.userId !== auth.user.id) {
    return jsonError("Note not found.", 404);
  }
  if (note.transcript.length === 0) {
    return jsonError("This note has no content yet.", 409);
  }

  const body = (await req.json().catch(() => null)) as {
    kind?: string;
  } | null;
  const kind = body?.kind;
  const plan = PLANS[auth.user.plan];

  try {
    if (kind === "flashcards") {
      const cards = await generateFlashcards(note, plan.flashcardsPerNote);
      const updated = await updateNote(id, (n) => {
        n.flashcards = cards;
      });
      return NextResponse.json({ flashcards: updated?.flashcards ?? cards });
    }
    if (kind === "quiz") {
      const questions = await generateQuiz(note, plan.quizPerNote);
      const updated = await updateNote(id, (n) => {
        n.quiz = questions;
      });
      return NextResponse.json({ quiz: updated?.quiz ?? questions });
    }
    if (kind === "notes") {
      const generated = await generateNoteContent(note);
      const updated = await updateNote(id, (n) => {
        n.summary = generated.summary;
        n.keyPoints = generated.keyPoints;
        n.notesMarkdown = generated.notesMarkdown;
        n.language = generated.language;
        n.translations = {};
        if (n.status !== "ready") {
          n.status = "ready";
          n.progress = 100;
          n.error = undefined;
        }
      });
      return NextResponse.json({ note: updated });
    }
    return jsonError(`Unknown kind '${kind}'.`);
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return jsonError(err.message, 503, err.code);
    }
    const message =
      err instanceof Error ? err.message : "Generation failed. Try again.";
    return jsonError(message, 500);
  }
}
