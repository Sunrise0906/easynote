import { Note, SourceType, saveNote } from "./store";
import { newId } from "./utils";

const SOURCE_EMOJI: Record<SourceType, string> = {
  youtube: "▶️",
  audio: "🎧",
  video: "🎬",
  pdf: "📄",
  image: "🖼️",
  text: "📝",
  recording: "🎙️",
};

export async function createNoteRecord(opts: {
  userId: string;
  sourceType: SourceType;
  title?: string;
  folderId?: string | null;
  sourceUrl?: string;
  youtubeId?: string;
  mediaFile?: string;
  mediaMime?: string;
  durationSec?: number;
  transcript?: Note["transcript"];
}): Promise<Note> {
  const now = Date.now();
  const note: Note = {
    id: newId("n"),
    userId: opts.userId,
    folderId: opts.folderId ?? null,
    title: opts.title?.trim() || "Untitled note",
    emoji: SOURCE_EMOJI[opts.sourceType],
    sourceType: opts.sourceType,
    sourceUrl: opts.sourceUrl,
    youtubeId: opts.youtubeId,
    mediaFile: opts.mediaFile,
    mediaMime: opts.mediaMime,
    durationSec: opts.durationSec,
    status: "pending",
    statusMessage: "Queued…",
    progress: 5,
    transcript: opts.transcript ?? [],
    translations: {},
    chat: [],
    shareToken: null,
    createdAt: now,
    updatedAt: now,
  };
  await saveNote(note);
  return note;
}
