/**
 * Client-safe shared types (no Node imports here — these are used in
 * browser components as well as on the server).
 */

export type SourceType =
  | "youtube"
  | "audio"
  | "video"
  | "pdf"
  | "image"
  | "text"
  | "recording";

export type NoteStatus =
  | "pending"
  | "transcribing"
  | "generating"
  | "ready"
  | "error";

export interface TranscriptSegment {
  start: number;
  end?: number;
  text: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export interface NoteTranslation {
  summary?: string;
  notesMarkdown?: string;
  updatedAt: number;
}

export interface NoteData {
  id: string;
  folderId: string | null;
  title: string;
  emoji: string;
  sourceType: SourceType;
  sourceUrl?: string;
  youtubeId?: string;
  mediaFile?: string;
  mediaMime?: string;
  durationSec?: number;
  status: NoteStatus;
  statusMessage?: string;
  progress: number;
  error?: string;
  language?: string;
  transcript: TranscriptSegment[];
  summary?: string;
  keyPoints?: string[];
  notesMarkdown?: string;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  translations: Record<string, NoteTranslation>;
  chat: ChatMessage[];
  shareToken: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface NoteSummaryData {
  id: string;
  folderId: string | null;
  title: string;
  emoji: string;
  sourceType: SourceType;
  status: NoteStatus;
  statusMessage?: string;
  progress: number;
  error?: string;
  summary?: string;
  youtubeId?: string;
  durationSec?: number;
  createdAt: number;
  updatedAt: number;
}

export interface FolderData {
  id: string;
  name: string;
  createdAt: number;
}

export interface AiModelOption {
  id: string;
  label: string;
  blurb: string;
  vision: boolean;
  tier: "free" | "pro";
  locked: boolean;
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    name: string;
    plan: "free" | "pro";
    planInterval?: "monthly" | "yearly";
    guest: boolean;
    createdAt: number;
    modelId?: string | null;
  } | null;
  quota?: {
    plan: string;
    notesUsed: number;
    notesLimit: number;
    chatUsed: number;
    chatLimit: number;
    maxUploadMB: number;
  };
  capabilities?: {
    ai: boolean;
    stt: boolean;
    vision?: boolean;
    models?: AiModelOption[];
    activeModel?: string | null;
  };
}

export const SOURCE_LABEL: Record<SourceType, string> = {
  youtube: "YouTube",
  audio: "Audio",
  video: "Video",
  pdf: "PDF",
  image: "Image",
  text: "Text",
  recording: "Recording",
};
