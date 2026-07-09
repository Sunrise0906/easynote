"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, Flame, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "../ui";
import { apiGet, apiPost } from "@/lib/client";
import { ReviewQueueCard, ReviewQueueResponse } from "@/lib/types";
import { Grade, GRADE_LABELS, previewIntervals } from "@/lib/srs";

const GRADE_STYLE: Record<Grade, string> = {
  1: "!bg-red-500/10 !text-red-600 !border-red-500/40 hover:!bg-red-500/20",
  2: "!bg-amber-500/10 !text-amber-600 !border-amber-500/40 hover:!bg-amber-500/20",
  3: "!bg-emerald-500/10 !text-emerald-600 !border-emerald-500/40 hover:!bg-emerald-500/20",
  4: "!bg-primary/10 !text-primary !border-primary/40 hover:!bg-primary/20",
};

export default function ReviewSession() {
  const [data, setData] = useState<ReviewQueueResponse | null>(null);
  const [queue, setQueue] = useState<ReviewQueueCard[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState("");
  const [grading, setGrading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<ReviewQueueResponse>("/api/review");
      setData(res);
      setQueue(res.queue);
      setDone(0);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your reviews.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const card = queue[0];
  const intervals = useMemo(
    () => (card ? previewIntervals(card.state) : null),
    [card]
  );

  const grade = async (g: Grade) => {
    if (!card || grading) return;
    setGrading(true);
    try {
      await apiPost("/api/review/grade", { cardId: card.id, grade: g });
    } catch {
      /* keep going; the schedule write is best-effort in the session */
    }
    setGrading(false);
    setRevealed(false);
    setDone((d) => d + 1);
    // "Again" → see it once more later this session; else drop it.
    setQueue((q) => (g === 1 ? [...q.slice(1), q[0]] : q.slice(1)));
  };

  // keyboard: space reveal, 1-4 grade
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card) return;
      if (e.code === "Space") {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        grade(Number(e.key) as Grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, revealed, grading]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="text-3xl">😕</div>
        <p className="mt-3 font-medium text-ink">{error}</p>
        <Button onClick={load} className="mt-4">
          Try again
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
        <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );
  }

  // nothing due
  if (!card) {
    const started = data.queue.length > 0;
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Brain size={30} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-ink">
          {started ? "Review complete 🎉" : "You're all caught up"}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
          {started
            ? `You reviewed ${done} card${done === 1 ? "" : "s"}. Recall will resurface them right before you'd forget.`
            : data.counts.total === 0
              ? "Generate flashcards on any note and they'll flow into your daily review here."
              : "No cards are due right now. Come back later — spaced repetition works best on schedule."}
        </p>
        {data.streak > 0 && (
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
            <Flame size={15} /> {data.streak}-day streak
          </div>
        )}
        <div className="mt-7 flex justify-center gap-2">
          <Link
            href="/memory"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2"
          >
            View memory dashboard
          </Link>
          <Link
            href="/notes"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink transition hover:opacity-90"
          >
            Back to notes
          </Link>
        </div>
      </div>
    );
  }

  const remaining = queue.length;
  const total = remaining + done;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-2xl flex-col px-4 py-8 sm:px-8">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Brain size={17} className="text-primary" /> Daily review
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          {data.streak > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-accent">
              <Flame size={13} /> {data.streak}
            </span>
          )}
          <span>
            {done} / {total}
          </span>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${total ? (done / total) * 100 : 0}%` }}
        />
      </div>

      {/* card */}
      <div className="mt-8 flex flex-1 flex-col">
        <Link
          href={`/notes/${card.noteId}`}
          className="mb-3 self-start text-xs font-medium text-muted transition hover:text-primary"
        >
          {card.noteTitle}
        </Link>
        <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-8">
          <div className="flex flex-1 items-center justify-center text-center">
            <div className="font-display text-xl font-semibold leading-8 text-ink">
              {card.front}
            </div>
          </div>
          {revealed && (
            <div className="mt-6 border-t border-border pt-6 text-center">
              <div className="animate-fade-up text-[15px] leading-7 text-muted">
                {card.back}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* controls */}
      <div className="mt-6">
        {!revealed ? (
          <Button
            onClick={() => setRevealed(true)}
            className="w-full py-3"
          >
            Show answer{" "}
            <span className="ml-1 text-xs opacity-70">(space)</span>
          </Button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {([1, 2, 3, 4] as Grade[]).map((g) => (
              <button
                key={g}
                onClick={() => grade(g)}
                disabled={grading}
                className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-2.5 text-sm font-bold transition disabled:opacity-50 ${GRADE_STYLE[g]}`}
              >
                {GRADE_LABELS[g]}
                <span className="text-[11px] font-medium opacity-70">
                  {intervals?.[g]}
                </span>
              </button>
            ))}
          </div>
        )}
        <p className="mt-3 text-center text-[11px] text-faint">
          Grade honestly — the schedule adapts to how well you actually recall.
        </p>
      </div>
    </div>
  );
}
