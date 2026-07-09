"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  RotateCcw,
  Shuffle,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Button } from "../../ui";
import { apiPost } from "@/lib/client";
import { Flashcard, NoteData } from "@/lib/types";

export default function FlashcardsTab({
  note,
  onNoteChange,
  aiReady,
}: {
  note: NoteData;
  onNoteChange: (n: NoteData) => void;
  aiReady: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState<number[] | null>(null);
  const [known, setKnown] = useState<Record<number, boolean>>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const cards = note.flashcards ?? [];
  const sequence = order ?? cards.map((_, i) => i);
  const current: Flashcard | undefined = cards[sequence[index]];

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await apiPost<{ flashcards: Flashcard[] }>(
        `/api/notes/${note.id}/generate`,
        { kind: "flashcards" }
      );
      onNoteChange({ ...note, flashcards: res.flashcards });
      setIndex(0);
      setFlipped(false);
      setOrder(null);
      setKnown({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center">
        <Brain className="mx-auto text-primary" size={36} />
        <div className="mt-3 font-display font-bold text-ink">
          Turn this note into flashcards
        </div>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
          {aiReady
            ? "The AI writes a spaced-repetition deck from this note — one concept per card."
            : "Configure an AI provider to unlock flashcard generation."}
        </p>
        {error && (
          <div className="mx-auto mt-4 max-w-md rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}
        {aiReady && (
          <Button onClick={generate} loading={generating} className="mt-5">
            <Sparkles size={16} /> Generate flashcards
          </Button>
        )}
      </div>
    );
  }

  const next = () => {
    setFlipped(false);
    setIndex((index + 1) % sequence.length);
  };
  const prev = () => {
    setFlipped(false);
    setIndex((index - 1 + sequence.length) % sequence.length);
  };
  const shuffle = () => {
    const shuffled = [...cards.keys()].sort(() => Math.random() - 0.5);
    setOrder(shuffled);
    setIndex(0);
    setFlipped(false);
  };
  const mark = (ok: boolean) => {
    setKnown({ ...known, [sequence[index]]: ok });
    next();
  };

  const knownCount = Object.values(known).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm">
        <div className="font-semibold text-ink">
          Card {index + 1}{" "}
          <span className="text-muted">/ {sequence.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
            {knownCount} known
          </span>
          <Button variant="ghost" onClick={shuffle} className="!px-2.5 !py-1.5" title="Shuffle deck">
            <Shuffle size={15} />
          </Button>
          {aiReady && (
            <Button
              variant="ghost"
              onClick={generate}
              loading={generating}
              className="!px-2.5 !py-1.5"
              title="Regenerate deck"
            >
              <RotateCcw size={15} />
            </Button>
          )}
        </div>
      </div>

      {/* progress */}
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((index + 1) / sequence.length) * 100}%` }}
        />
      </div>

      {/* card */}
      <div
        className="perspective-1000 h-72 cursor-pointer select-none sm:h-80"
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className={`preserve-3d relative h-full w-full transition-transform duration-500 ${flipped ? "rotate-y-180" : ""}`}
        >
          <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-8 text-center shadow-[var(--shadow-soft)]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
              Question
            </div>
            <div className="mt-4 text-lg font-semibold leading-8 text-ink">
              {current?.front}
            </div>
            <div className="absolute bottom-5 text-xs text-muted">
              Click to flip
            </div>
          </div>
          <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-lg border border-primary bg-primary p-8 text-center shadow-[var(--shadow-soft)]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary-ink/70">
              Answer
            </div>
            <div className="mt-4 text-base font-medium leading-7 text-primary-ink">
              {current?.back}
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="secondary" onClick={prev} className="!px-3.5">
          <ArrowLeft size={16} />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => mark(false)}
            className="!border-red-500/40 !text-red-600 hover:!bg-red-500/10"
          >
            <ThumbsDown size={15} /> Still learning
          </Button>
          <Button
            variant="secondary"
            onClick={() => mark(true)}
            className="!border-emerald-500/40 !text-emerald-600 hover:!bg-emerald-500/10"
          >
            <ThumbsUp size={15} /> Got it
          </Button>
        </div>
        <Button variant="secondary" onClick={next} className="!px-3.5">
          <ArrowRight size={16} />
        </Button>
      </div>
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
