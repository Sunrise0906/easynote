import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { deleteNote, getNote, updateNote } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  let note = await getNote(id);
  if (!note || note.userId !== auth.user.id) {
    return jsonError("Note not found.", 404);
  }
  const { reconcileStaleProcessing } = await import("@/lib/ingest");
  note = await reconcileStaleProcessing(note);
  return NextResponse.json({ note });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const existing = await getNote(id);
  if (!existing || existing.userId !== auth.user.id) {
    return jsonError("Note not found.", 404);
  }

  const body = (await req.json().catch(() => null)) as {
    title?: string;
    folderId?: string | null;
    notesMarkdown?: string;
    emoji?: string;
  } | null;
  if (!body) return jsonError("Invalid request body.");

  const note = await updateNote(id, (n) => {
    if (typeof body.title === "string" && body.title.trim()) {
      n.title = body.title.trim().slice(0, 160);
    }
    if (body.folderId !== undefined) n.folderId = body.folderId;
    if (typeof body.notesMarkdown === "string") {
      // Bound the size so a single note file can't be bloated to megabytes
      // (every listNotes/share lookup parses each note file).
      n.notesMarkdown = body.notesMarkdown.slice(0, 500_000);
    }
    if (typeof body.emoji === "string" && body.emoji) {
      n.emoji = body.emoji.slice(0, 8);
    }
  });
  return NextResponse.json({ note });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const note = await getNote(id);
  if (!note || note.userId !== auth.user.id) {
    return jsonError("Note not found.", 404);
  }
  await deleteNote(id);
  const { removeNoteCards } = await import("@/lib/reviews");
  await removeNoteCards(auth.user.id, id);
  return NextResponse.json({ ok: true });
}
