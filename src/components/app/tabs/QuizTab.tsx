"use client";

import { useState } from "react";
import {
  Check,
  ListChecks,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "../../ui";
import { apiPost } from "@/lib/client";
import { NoteData, QuizQuestion } from "@/lib/types";

export default function QuizTab({
  note,
  onNoteChange,
  aiReady,
}: {
  note: NoteData;
  onNoteChange: (n: NoteData) => void;
  aiReady: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const questions = note.quiz ?? [];
  const q: QuizQuestion | undefined = questions[index];

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await apiPost<{ quiz: QuizQuestion[] }>(
        `/api/notes/${note.id}/generate`,
        { kind: "quiz" }
      );
      onNoteChange({ ...note, quiz: res.quiz });
      restart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setAnswers([]);
    setFinished(false);
  };

  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center">
        <ListChecks className="mx-auto text-primary" size={36} />
        <div className="mt-3 font-display font-bold text-ink">Quiz yourself</div>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
          {aiReady
            ? "Multiple-choice questions with explanations, generated from this note."
            : "Configure an AI provider to unlock quiz generation."}
        </p>
        {error && (
          <div className="mx-auto mt-4 max-w-md rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}
        {aiReady && (
          <Button onClick={generate} loading={generating} className="mt-5">
            <Sparkles size={16} /> Generate quiz
          </Button>
        )}
      </div>
    );
  }

  if (finished) {
    const score = answers.filter(Boolean).length;
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="mx-auto max-w-md rounded-lg border border-border bg-surface px-8 py-12 text-center">
        <Trophy
          size={48}
          className={`mx-auto ${pct >= 80 ? "text-accent" : "text-faint"}`}
        />
        <div className="mt-4 font-display text-3xl font-extrabold text-ink">
          {score} / {questions.length}
        </div>
        <div className="mt-1 text-sm text-muted">
          {pct >= 80
            ? "Excellent — you know this material!"
            : pct >= 50
              ? "Good progress. Review the explanations and go again."
              : "Worth another pass through the notes before retrying."}
        </div>
        <div className="mx-auto mt-5 h-2.5 max-w-xs overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-accent" : "bg-red-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-7 flex justify-center gap-2">
          <Button variant="secondary" onClick={restart}>
            <RotateCcw size={15} /> Retake
          </Button>
          {aiReady && (
            <Button onClick={generate} loading={generating}>
              <Sparkles size={15} /> New questions
            </Button>
          )}
        </div>
      </div>
    );
  }

  const answered = picked !== null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm">
        <div className="font-semibold text-ink">
          Question {index + 1}{" "}
          <span className="text-muted">/ {questions.length}</span>
        </div>
        <div className="text-xs text-muted">
          {answers.filter(Boolean).length} correct so far
        </div>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
        <div className="font-display text-lg font-bold leading-8 text-ink">
          {q?.question}
        </div>
        <div className="mt-5 space-y-2.5">
          {q?.options.map((opt, i) => {
            const isCorrect = i === q.answerIndex;
            const isPicked = picked === i;
            let cls =
              "border-border hover:border-primary hover:bg-primary/5";
            if (answered && isCorrect) {
              cls = "border-emerald-500/60 bg-emerald-500/10";
            } else if (answered && isPicked && !isCorrect) {
              cls = "border-red-500/60 bg-red-500/10";
            } else if (answered) {
              cls = "border-border opacity-60";
            }
            return (
              <button
                key={i}
                disabled={answered}
                onClick={() => {
                  setPicked(i);
                  setAnswers([...answers, i === q.answerIndex]);
                }}
                className={`flex w-full items-center gap-3 rounded-md border-2 px-4 py-3 text-left text-[15px] font-medium text-ink transition ${cls}`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    answered && isCorrect
                      ? "bg-emerald-500 text-white"
                      : answered && isPicked && !isCorrect
                        ? "bg-red-500 text-white"
                        : "bg-surface-2 text-muted"
                  }`}
                >
                  {answered && isCorrect ? (
                    <Check size={13} />
                  ) : answered && isPicked && !isCorrect ? (
                    <X size={13} />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`mt-5 rounded-md p-4 text-sm leading-6 ${
              picked === q?.answerIndex
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-accent/10 text-ink"
            }`}
          >
            <span className="font-bold">
              {picked === q?.answerIndex ? "Correct! " : "Not quite. "}
            </span>
            {q?.explanation}
          </div>
        )}

        {answered && (
          <div className="mt-5 flex justify-end">
            <Button
              onClick={() => {
                if (index + 1 >= questions.length) {
                  setFinished(true);
                } else {
                  setIndex(index + 1);
                  setPicked(null);
                }
              }}
            >
              {index + 1 >= questions.length ? "See results" : "Next question"}
            </Button>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
