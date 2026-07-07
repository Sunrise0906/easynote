import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { getNote, updateNote } from "@/lib/store";
import { newToken } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

/** POST { enabled: boolean } — turn the public share link on/off. */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const note = await getNote(id);
  if (!note || note.userId !== auth.user.id) {
    return jsonError("Note not found.", 404);
  }
  const body = (await req.json().catch(() => null)) as {
    enabled?: boolean;
  } | null;

  const enabled = body?.enabled ?? !note.shareToken;
  const updated = await updateNote(id, (n) => {
    n.shareToken = enabled ? n.shareToken || newToken(12) : null;
  });
  return NextResponse.json({
    shareToken: updated?.shareToken ?? null,
    shareUrl: updated?.shareToken ? `/share/${updated.shareToken}` : null,
  });
}
