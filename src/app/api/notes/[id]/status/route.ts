import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { getNote } from "@/lib/store";
import { reconcileStaleProcessing } from "@/lib/ingest";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  let note = await getNote(id);
  if (!note || note.userId !== auth.user.id) {
    return jsonError("Note not found.", 404);
  }
  note = await reconcileStaleProcessing(note);
  return NextResponse.json({
    status: note.status,
    statusMessage: note.statusMessage,
    progress: note.progress,
    error: note.error,
  });
}
