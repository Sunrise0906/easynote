import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { getNote, updateNote } from "@/lib/store";
import { processNoteInBackground } from "@/lib/ingest";
import { rateLimit } from "@/lib/ratelimit";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  if (!rateLimit(`ai:retry:${auth.user.id}`, 20, 60 * 60 * 1000)) {
    return jsonError("Too many retries — please wait a minute.", 429);
  }
  const { id } = await params;
  const note = await getNote(id);
  if (!note || note.userId !== auth.user.id) {
    return jsonError("Note not found.", 404);
  }
  await updateNote(id, (n) => {
    n.status = "pending";
    n.statusMessage = "Queued…";
    n.progress = 5;
    n.error = undefined;
  });
  processNoteInBackground(id);
  return NextResponse.json({ ok: true });
}
