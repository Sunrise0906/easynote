"use client";

import { Check, CircleAlert, Loader2, RotateCcw } from "lucide-react";
import { Button } from "../ui";
import { NoteData, SOURCE_LABEL } from "@/lib/types";

const STEP_DEFS = [
  { key: "capture", label: "Reading your source" },
  { key: "generate", label: "Writing AI notes" },
  { key: "ready", label: "Ready to study" },
];

export default function ProcessSteps({
  note,
  onRetry,
  retrying,
}: {
  note: NoteData;
  onRetry: () => void;
  retrying: boolean;
}) {
  const stage =
    note.status === "pending" || note.status === "transcribing"
      ? 0
      : note.status === "generating"
        ? 1
        : 2;

  return (
    <div className="mx-auto max-w-lg py-14 text-center">
      <div className="text-5xl">{note.emoji}</div>
      <h2 className="mt-4 text-xl font-extrabold text-slate-900">
        {note.title}
      </h2>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {SOURCE_LABEL[note.sourceType]}
      </div>

      {note.status === "error" ? (
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-left">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 shrink-0 text-rose-500" size={20} />
            <div>
              <div className="font-bold text-rose-800">Processing failed</div>
              <p className="mt-1 text-sm leading-6 text-rose-700">
                {note.error}
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={onRetry} loading={retrying} variant="secondary">
              <RotateCcw size={15} /> Try again
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mx-auto mt-8 max-w-sm space-y-3 text-left">
            {STEP_DEFS.map((s, i) => {
              const done = stage > i;
              const active = stage === i;
              return (
                <div
                  key={s.key}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    active
                      ? "border-brand-300 bg-brand-50"
                      : done
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-slate-200 bg-white"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-brand-600 text-white"
                          : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {done ? (
                      <Check size={14} />
                    ) : active ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div>
                    <div
                      className={`text-sm font-semibold ${active ? "text-brand-800" : done ? "text-emerald-800" : "text-slate-500"}`}
                    >
                      {s.label}
                    </div>
                    {active && note.statusMessage && (
                      <div className="text-xs text-slate-500">
                        {note.statusMessage}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mx-auto mt-6 h-2 max-w-sm overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 transition-all duration-700"
              style={{ width: `${Math.max(8, note.progress)}%` }}
            />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            This usually takes under a minute for links and text, longer for
            audio.
          </p>
        </>
      )}
    </div>
  );
}
