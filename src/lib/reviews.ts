import crypto from "crypto";
import fsp from "fs/promises";
import { dataPath, listNotes } from "./store";
import {
  Grade,
  SrsState,
  emptyState,
  retrievability,
  schedule,
} from "./srs";
import { dayKey } from "./utils";

/**
 * Per-user spaced-repetition pool. Every flashcard a user generates flows in
 * here and gets a memory model; this is Recall's retention loop, independent
 * of the note it came from (you review across all notes at once).
 */

export interface ReviewCard {
  id: string;
  noteId: string;
  noteTitle: string;
  front: string;
  back: string;
  srs: SrsState;
  createdAt: number;
}

export interface ReviewLog {
  ts: number;
  cardId: string;
  grade: Grade;
  day: string;
}

export interface ReviewStore {
  cards: ReviewCard[];
  history: ReviewLog[];
  lastReviewDay: string | null;
  streak: number;
}

/* ---------------- persistence (atomic + per-user lock) ------------- */

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

function fileFor(userId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(userId)) throw new Error("bad user id");
  return dataPath("reviews", `${userId}.json`);
}

async function read(userId: string): Promise<ReviewStore> {
  try {
    const raw = await fsp.readFile(fileFor(userId), "utf8");
    const s = JSON.parse(raw) as ReviewStore;
    s.cards ??= [];
    s.history ??= [];
    s.streak ??= 0;
    s.lastReviewDay ??= null;
    return s;
  } catch {
    return { cards: [], history: [], lastReviewDay: null, streak: 0 };
  }
}

async function write(userId: string, store: ReviewStore): Promise<void> {
  const dir = dataPath("reviews");
  await fsp.mkdir(dir, { recursive: true });
  const file = fileFor(userId);
  const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fsp.rename(tmp, file);
}

function cardId(noteId: string, front: string): string {
  const norm = front.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 300);
  return crypto
    .createHash("sha1")
    .update(`${noteId}::${norm}`)
    .digest("base64url")
    .slice(0, 16);
}

/* ---------------- sync from notes ---------------------------------- */

/**
 * Ensure every flashcard across the user's notes exists in the pool. New
 * cards start as "new" (due now). Existing cards keep their memory state.
 * Orphan cards whose note or flashcard is gone are pruned.
 */
export async function syncFromNotes(userId: string): Promise<ReviewStore> {
  const notes = await listNotes(userId);
  return withLock(userId, async () => {
    const store = await read(userId);
    const byId = new Map(store.cards.map((c) => [c.id, c]));
    const validIds = new Set<string>();
    const now = Date.now();

    for (const note of notes) {
      for (const fc of note.flashcards ?? []) {
        if (!fc.front?.trim() || !fc.back?.trim()) continue;
        const id = cardId(note.id, fc.front);
        validIds.add(id);
        const existing = byId.get(id);
        if (existing) {
          existing.back = fc.back;
          existing.noteTitle = note.title;
        } else {
          const card: ReviewCard = {
            id,
            noteId: note.id,
            noteTitle: note.title,
            front: fc.front,
            back: fc.back,
            srs: emptyState(now),
            createdAt: now,
          };
          byId.set(id, card);
        }
      }
    }
    // prune cards no longer backed by a note flashcard
    store.cards = [...byId.values()].filter((c) => validIds.has(c.id));
    await write(userId, store);
    return store;
  });
}

export async function removeNoteCards(
  userId: string,
  noteId: string
): Promise<void> {
  await withLock(userId, async () => {
    const store = await read(userId);
    store.cards = store.cards.filter((c) => c.noteId !== noteId);
    await write(userId, store);
  });
}

/* ---------------- review / grade ---------------------------------- */

export interface QueueCard {
  id: string;
  noteId: string;
  noteTitle: string;
  front: string;
  back: string;
  state: SrsState;
}

const SESSION_LIMIT = 60;

export function dueQueue(store: ReviewStore, now = Date.now()): QueueCard[] {
  return store.cards
    .filter((c) => c.srs.due <= now)
    // new cards last so reviews (retention) come first; then by due time
    .sort((a, b) => {
      const an = a.srs.state === "new" ? 1 : 0;
      const bn = b.srs.state === "new" ? 1 : 0;
      if (an !== bn) return an - bn;
      return a.srs.due - b.srs.due;
    })
    .slice(0, SESSION_LIMIT)
    .map((c) => ({
      id: c.id,
      noteId: c.noteId,
      noteTitle: c.noteTitle,
      front: c.front,
      back: c.back,
      state: c.srs,
    }));
}

export async function gradeCard(
  userId: string,
  cardId: string,
  grade: Grade
): Promise<{ ok: boolean; next?: SrsState }> {
  return withLock(userId, async () => {
    const store = await read(userId);
    const card = store.cards.find((c) => c.id === cardId);
    if (!card) return { ok: false };
    const now = Date.now();
    card.srs = schedule(card.srs, grade, now);

    // streak: consecutive days with at least one review
    const today = dayKey(now);
    if (store.lastReviewDay !== today) {
      const yesterday = dayKey(now - 86_400_000);
      store.streak = store.lastReviewDay === yesterday ? store.streak + 1 : 1;
      store.lastReviewDay = today;
    }
    store.history.push({ ts: now, cardId, grade, day: today });
    if (store.history.length > 5000) store.history = store.history.slice(-5000);

    await write(userId, store);
    return { ok: true, next: card.srs };
  });
}

/* ---------------- stats for the memory dashboard ------------------ */

export interface MemoryStats {
  totalCards: number;
  reviewedCards: number;
  newCards: number;
  dueNow: number;
  dueToday: number;
  streak: number;
  /** Average current recall probability across reviewed cards (0..100). */
  retention: number;
  notes: {
    noteId: string;
    title: string;
    total: number;
    due: number;
    mastery: number; // 0..100
  }[];
  forgettingSoon: {
    id: string;
    noteId: string;
    noteTitle: string;
    front: string;
    retrievability: number; // 0..100
  }[];
  /** Reviews per day for the last 30 days. */
  activity: { day: string; count: number }[];
}

export function memoryStats(store: ReviewStore, now = Date.now()): MemoryStats {
  const reviewed = store.cards.filter((c) => c.srs.state !== "new");
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const eod = endOfToday.getTime();

  const retentions = reviewed.map((c) => retrievability(c.srs, now));
  const retention =
    retentions.length > 0
      ? (retentions.reduce((a, b) => a + b, 0) / retentions.length) * 100
      : 0;

  // per-note aggregation
  const byNote = new Map<
    string,
    { title: string; total: number; due: number; rSum: number; rCount: number }
  >();
  for (const c of store.cards) {
    const g =
      byNote.get(c.noteId) ??
      { title: c.noteTitle, total: 0, due: 0, rSum: 0, rCount: 0 };
    g.title = c.noteTitle;
    g.total += 1;
    if (c.srs.due <= now) g.due += 1;
    if (c.srs.state !== "new") {
      g.rSum += retrievability(c.srs, now);
      g.rCount += 1;
    }
    byNote.set(c.noteId, g);
  }
  const notes = [...byNote.entries()]
    .map(([noteId, g]) => ({
      noteId,
      title: g.title,
      total: g.total,
      due: g.due,
      mastery: g.rCount > 0 ? Math.round((g.rSum / g.rCount) * 100) : 0,
    }))
    .sort((a, b) => a.mastery - b.mastery);

  const forgettingSoon = reviewed
    .map((c) => ({
      id: c.id,
      noteId: c.noteId,
      noteTitle: c.noteTitle,
      front: c.front,
      retrievability: retrievability(c.srs, now),
    }))
    .filter((c) => c.retrievability < 0.9)
    .sort((a, b) => a.retrievability - b.retrievability)
    .slice(0, 12)
    .map((c) => ({ ...c, retrievability: Math.round(c.retrievability * 100) }));

  // last 30 days activity
  const counts = new Map<string, number>();
  for (const log of store.history) {
    counts.set(log.day, (counts.get(log.day) ?? 0) + 1);
  }
  const activity: { day: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = dayKey(now - i * 86_400_000);
    activity.push({ day: d, count: counts.get(d) ?? 0 });
  }

  return {
    totalCards: store.cards.length,
    reviewedCards: reviewed.length,
    newCards: store.cards.length - reviewed.length,
    dueNow: store.cards.filter((c) => c.srs.due <= now).length,
    dueToday: store.cards.filter((c) => c.srs.due <= eod).length,
    streak: store.streak,
    retention: Math.round(retention),
    notes,
    forgettingSoon,
    activity,
  };
}

export { read as readReviewStore };
