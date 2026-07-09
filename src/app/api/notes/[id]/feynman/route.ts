import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { getNote } from "@/lib/store";
import { evaluateFeynman } from "@/lib/ai/generate";
import { AiNotConfiguredError } from "@/lib/ai/client";
import { resolveModelForUser } from "@/lib/ai/models";
import { aiConfigured } from "@/lib/config";
import { rateLimit } from "@/lib/ratelimit";
import { countWords } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

/**
 * POST { transcript, topic?, durationSec? } — grade a spoken Feynman-style
 * explanation of the note on content + presentation.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  if (!aiConfigured()) {
    return jsonError(new AiNotConfiguredError().message, 503, "ai_not_configured");
  }
  if (!rateLimit(`feynman:${auth.user.id}`, 30, 60 * 60 * 1000)) {
    return jsonError("You're practising very fast — take a breath and retry in a minute.", 429);
  }

  const { id } = await params;
  const note = await getNote(id);
  if (!note || note.userId !== auth.user.id) {
    return jsonError("Note not found.", 404);
  }
  if (note.transcript.length === 0) {
    return jsonError("This note has no content to check against yet.", 409);
  }

  const body = (await req.json().catch(() => null)) as {
    transcript?: string;
    topic?: string;
    durationSec?: number;
  } | null;
  const explanation = body?.transcript?.trim();
  if (!explanation || explanation.length < 15) {
    return jsonError("Say a bit more — explain the idea in a few sentences.");
  }
  if (explanation.length > 20_000) {
    return jsonError("That explanation is very long — try a focused 1-3 minute take.");
  }

  const topic = (body?.topic?.trim() || note.title).slice(0, 200);
  try {
    const evaluation = await evaluateFeynman(
      note,
      explanation,
      topic,
      { durationSec: body?.durationSec, wordCount: countWords(explanation) },
      resolveModelForUser(auth.user)?.id
    );
    return NextResponse.json({ evaluation });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return jsonError(err.message, 503, err.code);
    }
    return jsonError(
      err instanceof Error ? err.message : "Could not evaluate. Try again.",
      500
    );
  }
}
