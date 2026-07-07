import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { listFolders, saveFolder } from "@/lib/store";
import { newId } from "@/lib/utils";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const folders = await listFolders(auth.user.id);
  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const body = (await req.json().catch(() => null)) as {
    name?: string;
  } | null;
  const name = body?.name?.trim();
  if (!name) return jsonError("Folder name is required.");
  if (name.length > 60) return jsonError("Folder name is too long.");
  const existing = await listFolders(auth.user.id);
  if (existing.length >= 50) return jsonError("Too many folders.");
  if (existing.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
    return jsonError("A folder with this name already exists.");
  }
  const folder = await saveFolder({
    id: newId("f"),
    userId: auth.user.id,
    name,
    createdAt: Date.now(),
  });
  return NextResponse.json({ folder });
}
