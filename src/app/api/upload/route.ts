import fsp from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { createNoteRecord } from "@/lib/notes";
import { canCreateNote, quotaInfo, recordNoteCreated } from "@/lib/quota";
import { SourceType, uploadsDir } from "@/lib/store";
import { processNoteInBackground } from "@/lib/ingest";

export const runtime = "nodejs";

const KIND_BY_MIME: [RegExp, SourceType][] = [
  [/^audio\//, "audio"],
  [/^video\//, "video"],
  [/^application\/pdf$/, "pdf"],
  [/^image\//, "image"],
];

const EXT_FALLBACK: Record<string, SourceType> = {
  mp3: "audio",
  m4a: "audio",
  wav: "audio",
  aac: "audio",
  ogg: "audio",
  oga: "audio",
  flac: "audio",
  webm: "audio",
  mp4: "video",
  mov: "video",
  mkv: "video",
  avi: "video",
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
};

function detectSourceType(file: File): SourceType | null {
  for (const [re, kind] of KIND_BY_MIME) {
    if (re.test(file.type)) return kind;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_FALLBACK[ext] ?? null;
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  if (!canCreateNote(user)) {
    return jsonError(
      "You've reached this month's note limit on the Starter plan. Upgrade to Pro for unlimited notes.",
      403,
      "quota_exceeded"
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) {
    return jsonError("No file received.");
  }

  const q = quotaInfo(user);
  if (file.size > q.maxUploadMB * 1024 * 1024) {
    return jsonError(
      `File is larger than your plan's ${q.maxUploadMB} MB upload limit.`,
      413,
      "file_too_large"
    );
  }

  const sourceType = detectSourceType(file);
  if (!sourceType) {
    return jsonError(
      "Unsupported file type. Upload audio (mp3, m4a, wav…), video (mp4, mov…), PDF, or an image."
    );
  }

  // A recorded-in-browser upload attaches to an existing recording note.
  const attachTo = form.get("attachTo");

  const safeExt =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "bin";

  if (typeof attachTo === "string" && attachTo) {
    const { getNote, updateNote } = await import("@/lib/store");
    const note = await getNote(attachTo);
    if (!note || note.userId !== user.id) return jsonError("Note not found.", 404);
    const mediaFile = `${note.id}.${safeExt}`;
    await fsp.writeFile(
      path.join(uploadsDir(), mediaFile),
      Buffer.from(await file.arrayBuffer())
    );
    await updateNote(note.id, (n) => {
      n.mediaFile = mediaFile;
      n.mediaMime = file.type || "audio/webm";
    });
    return NextResponse.json({ note: { id: note.id } });
  }

  const title = file.name.replace(/\.[^.]+$/, "");
  const note = await createNoteRecord({
    userId: user.id,
    sourceType,
    title,
    folderId:
      typeof form.get("folderId") === "string"
        ? String(form.get("folderId")) || null
        : null,
    mediaMime: file.type || undefined,
  });

  const mediaFile = `${note.id}.${safeExt}`;
  await fsp.writeFile(
    path.join(uploadsDir(), mediaFile),
    Buffer.from(await file.arrayBuffer())
  );
  const { updateNote } = await import("@/lib/store");
  await updateNote(note.id, (n) => {
    n.mediaFile = mediaFile;
  });

  await recordNoteCreated(user.id);
  processNoteInBackground(note.id);
  return NextResponse.json({ note: { id: note.id } });
}
