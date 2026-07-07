import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import {
  deleteFolder,
  listFolders,
  listNotes,
  saveFolder,
  updateNote,
} from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const folders = await listFolders(auth.user.id);
  const folder = folders.find((f) => f.id === id);
  if (!folder) return jsonError("Folder not found.", 404);
  const body = (await req.json().catch(() => null)) as {
    name?: string;
  } | null;
  const name = body?.name?.trim();
  if (!name) return jsonError("Folder name is required.");
  folder.name = name.slice(0, 60);
  await saveFolder(folder);
  return NextResponse.json({ folder });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const folders = await listFolders(auth.user.id);
  if (!folders.some((f) => f.id === id)) {
    return jsonError("Folder not found.", 404);
  }
  // Move contained notes back to "All notes" before deleting.
  const notes = await listNotes(auth.user.id);
  for (const n of notes) {
    if (n.folderId === id) {
      await updateNote(n.id, (x) => {
        x.folderId = null;
      });
    }
  }
  await deleteFolder(id, auth.user.id);
  return NextResponse.json({ ok: true });
}
