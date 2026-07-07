import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { config, PlanId } from "./config";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

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
  /** Seconds into the media. For PDFs this is the 1-based page number. */
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

export interface Note {
  id: string;
  userId: string;
  folderId: string | null;
  title: string;
  emoji: string;
  sourceType: SourceType;
  sourceUrl?: string;
  youtubeId?: string;
  /** File name inside data/uploads (audio/video/pdf/image sources). */
  mediaFile?: string;
  mediaMime?: string;
  durationSec?: number;

  status: NoteStatus;
  statusMessage?: string;
  progress: number; // 0-100
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

export interface UserUsage {
  /** month key -> notes created that month */
  notes: Record<string, number>;
  /** day key -> chat messages sent that day */
  chat: Record<string, number>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  guest: boolean;
  plan: PlanId;
  planInterval?: "monthly" | "yearly";
  planSince?: number;
  usage: UserUsage;
  createdAt: number;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
}

/** Lightweight listing shape sent to the dashboard. */
export interface NoteSummary {
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

/* ------------------------------------------------------------------ */
/* Low-level JSON persistence (atomic writes + per-file async locks)   */
/* ------------------------------------------------------------------ */

const locks = new Map<string, Promise<unknown>>();

function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(
    key,
    next.catch(() => undefined)
  );
  return next;
}

export function dataPath(...parts: string[]): string {
  return path.join(config.dataDir, ...parts);
}

export function uploadsDir(): string {
  return dataPath("uploads");
}

function ensureDirs() {
  for (const dir of [config.dataDir, dataPath("notes"), uploadsDir()]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  ensureDirs();
  try {
    const raw = await fsp.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  ensureDirs();
  const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fsp.rename(tmp, file);
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

const USERS_FILE = () => dataPath("users.json");

export async function listUsers(): Promise<User[]> {
  return readJson<User[]>(USERS_FILE(), []);
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await listUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await listUsers();
  const norm = email.trim().toLowerCase();
  return users.find((u) => u.email === norm) ?? null;
}

export async function saveUser(user: User): Promise<User> {
  return withLock("users", async () => {
    const users = await readJson<User[]>(USERS_FILE(), []);
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    await writeJson(USERS_FILE(), users);
    return user;
  });
}

export async function updateUser(
  id: string,
  patch: Partial<User> | ((u: User) => void)
): Promise<User | null> {
  return withLock("users", async () => {
    const users = await readJson<User[]>(USERS_FILE(), []);
    const user = users.find((u) => u.id === id);
    if (!user) return null;
    if (typeof patch === "function") patch(user);
    else Object.assign(user, patch);
    await writeJson(USERS_FILE(), users);
    return user;
  });
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

const SESSIONS_FILE = () => dataPath("sessions.json");

export async function createSession(session: Session): Promise<void> {
  await withLock("sessions", async () => {
    let sessions = await readJson<Session[]>(SESSIONS_FILE(), []);
    const now = Date.now();
    sessions = sessions.filter((s) => s.expiresAt > now);
    sessions.push(session);
    await writeJson(SESSIONS_FILE(), sessions);
  });
}

export async function getSession(token: string): Promise<Session | null> {
  const sessions = await readJson<Session[]>(SESSIONS_FILE(), []);
  const s = sessions.find((x) => x.token === token);
  if (!s || s.expiresAt < Date.now()) return null;
  return s;
}

export async function deleteSession(token: string): Promise<void> {
  await withLock("sessions", async () => {
    const sessions = await readJson<Session[]>(SESSIONS_FILE(), []);
    await writeJson(
      SESSIONS_FILE(),
      sessions.filter((s) => s.token !== token)
    );
  });
}

/* ------------------------------------------------------------------ */
/* Folders                                                             */
/* ------------------------------------------------------------------ */

const FOLDERS_FILE = () => dataPath("folders.json");

export async function listFolders(userId: string): Promise<Folder[]> {
  const all = await readJson<Folder[]>(FOLDERS_FILE(), []);
  return all
    .filter((f) => f.userId === userId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveFolder(folder: Folder): Promise<Folder> {
  return withLock("folders", async () => {
    const all = await readJson<Folder[]>(FOLDERS_FILE(), []);
    const idx = all.findIndex((f) => f.id === folder.id);
    if (idx >= 0) all[idx] = folder;
    else all.push(folder);
    await writeJson(FOLDERS_FILE(), all);
    return folder;
  });
}

export async function deleteFolder(id: string, userId: string): Promise<void> {
  await withLock("folders", async () => {
    const all = await readJson<Folder[]>(FOLDERS_FILE(), []);
    await writeJson(
      FOLDERS_FILE(),
      all.filter((f) => !(f.id === id && f.userId === userId))
    );
  });
}

/* ------------------------------------------------------------------ */
/* Notes (one JSON file per note)                                      */
/* ------------------------------------------------------------------ */

function noteFile(id: string): string {
  // ids are base64url — safe as file names, but be defensive anyway
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error("bad note id");
  return dataPath("notes", `${id}.json`);
}

export async function getNote(id: string): Promise<Note | null> {
  try {
    const raw = await fsp.readFile(noteFile(id), "utf8");
    return JSON.parse(raw) as Note;
  } catch {
    return null;
  }
}

export async function saveNote(note: Note): Promise<Note> {
  note.updatedAt = Date.now();
  await withLock(`note:${note.id}`, () => writeJson(noteFile(note.id), note));
  return note;
}

/** Read-modify-write under the note's lock; returns null if missing. */
export async function updateNote(
  id: string,
  mutate: (n: Note) => void
): Promise<Note | null> {
  return withLock(`note:${id}`, async () => {
    let note: Note | null = null;
    try {
      note = JSON.parse(await fsp.readFile(noteFile(id), "utf8")) as Note;
    } catch {
      return null;
    }
    mutate(note);
    note.updatedAt = Date.now();
    await writeJson(noteFile(id), note);
    return note;
  });
}

export async function deleteNote(id: string): Promise<void> {
  await withLock(`note:${id}`, async () => {
    const note = await getNote(id);
    try {
      await fsp.unlink(noteFile(id));
    } catch {
      /* already gone */
    }
    if (note?.mediaFile) {
      try {
        await fsp.unlink(path.join(uploadsDir(), note.mediaFile));
      } catch {
        /* ignore */
      }
    }
  });
}

export async function listNotes(userId: string): Promise<Note[]> {
  ensureDirs();
  const dir = dataPath("notes");
  let files: string[] = [];
  try {
    files = await fsp.readdir(dir);
  } catch {
    return [];
  }
  const notes: Note[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = await fsp.readFile(path.join(dir, f), "utf8");
      const n = JSON.parse(raw) as Note;
      if (n.userId === userId) notes.push(n);
    } catch {
      /* skip corrupt file */
    }
  }
  return notes.sort((a, b) => b.createdAt - a.createdAt);
}

export async function findNoteByShareToken(
  token: string
): Promise<Note | null> {
  ensureDirs();
  const dir = dataPath("notes");
  let files: string[] = [];
  try {
    files = await fsp.readdir(dir);
  } catch {
    return null;
  }
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = await fsp.readFile(path.join(dir, f), "utf8");
      const n = JSON.parse(raw) as Note;
      if (n.shareToken && n.shareToken === token) return n;
    } catch {
      /* skip */
    }
  }
  return null;
}

export function toSummary(n: Note): NoteSummary {
  return {
    id: n.id,
    folderId: n.folderId,
    title: n.title,
    emoji: n.emoji,
    sourceType: n.sourceType,
    status: n.status,
    statusMessage: n.statusMessage,
    progress: n.progress,
    error: n.error,
    summary: n.summary ? n.summary.slice(0, 220) : undefined,
    youtubeId: n.youtubeId,
    durationSec: n.durationSec,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

export function transcriptFullText(n: Note): string {
  return n.transcript.map((s) => s.text).join("\n");
}
