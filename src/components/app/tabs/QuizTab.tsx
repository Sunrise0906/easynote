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
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <ListChecks className="mx-auto text-brand-400" size={36} />
        <div className="mt-3 font-bold text-slate-800">Quiz yourself</div>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
          {aiReady
            ? "Multiple-choice questions with explanations, generated from this note."
            : "Add ANTHROPIC_API_KEY to .env.local to unlock quiz generation."}
        </p>
        {error && (
          <div className="mx-auto mt-4 max-w-md rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
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
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white px-8 py-12 text-center">
        <Trophy
          size={48}
          className={`mx-auto ${pct >= 80 ? "text-amber-400" : "text-slate-300"}`}
        />
        <div className="mt-4 text-3xl font-extrabold text-slate-900">
          {score} / {questions.length}
        </div>
        <div className="mt-1 text-sm text-slate-500">
          {pct >= 80
            ? "Excellent — you know this material!"
            : pct >= 50
              ? "Good progress. Review the explanations and go again."
              : "Worth another pass through the notes before retrying."}
        </div>
        <div className="mx-auto mt-5 h-2.5 max-w-xs overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-rose-400"}`}
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
        <div className="font-semibold text-slate-700">
          Question {index + 1}{" "}
          <span className="text-slate-400">/ {questions.length}</span>
        </div>
        <div className="text-xs text-slate-400">
          {answers.filter(Boolean).length} correct so far
        </div>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="text-lg font-bold leading-8 text-slate-900">
          {q?.question}
        </div>
        <div className="mt-5 space-y-2.5">
          {q?.options.map((opt, i) => {
            const isCorrect = i === q.answerIndex;
            const isPicked = picked === i;
            let cls =
              "border-slate-200 hover:border-brand-400 hover:bg-brand-50/50";
            if (answered && isCorrect) {
              cls = "border-emerald-400 bg-emerald-50";
            } else if (answered && isPicked && !isCorrect) {
              cls = "border-rose-400 bg-rose-50";
            } else if (answered) {
              cls = "border-slate-200 opacity-60";
            }
            return (
              <button
                key={i}
                disabled={answered}
                onClick={() => {
                  setPicked(i);
                  setAnswers([...answers, i === q.answerIndex]);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[15px] font-medium text-slate-800 transition ${cls}`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    answered && isCorrect
                      ? "bg-emerald-500 text-white"
                      : answered && isPicked && !isCorrect
                        ? "bg-rose-500 text-white"
                        : "bg-slate-100 text-slate-500"
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
            className={`mt-5 rounded-2xl p-4 text-sm leading-6 ${
              picked === q?.answerIndex
                ? "bg-emerald-50 text-emerald-800"
                : "bg-amber-50 text-amber-800"
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
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
