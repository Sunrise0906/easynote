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
      <h2 className="mt-4 font-display text-xl font-extrabold text-ink">
        {note.title}
      </h2>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">
        {SOURCE_LABEL[note.sourceType]}
      </div>

      {note.status === "error" ? (
        <div className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-left">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 shrink-0 text-red-500" size={20} />
            <div>
              <div className="font-display font-bold text-red-600">Processing failed</div>
              <p className="mt-1 text-sm leading-6 text-red-600">
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
                  className={`flex items-center gap-3 rounded-md border px-4 py-3 ${
                    active
                      ? "border-primary/40 bg-primary/10"
                      : done
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-border bg-surface"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-primary text-primary-ink"
                          : "bg-surface-2 text-muted"
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
                      className={`text-sm font-semibold ${active ? "text-primary" : done ? "text-emerald-600" : "text-muted"}`}
                    >
                      {s.label}
                    </div>
                    {active && note.statusMessage && (
                      <div className="text-xs text-muted">
                        {note.statusMessage}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mx-auto mt-6 h-2 max-w-sm overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.max(8, note.progress)}%` }}
            />
          </div>
          <p className="mt-4 text-xs text-muted">
            This usually takes under a minute for links and text, longer for
            audio.
          </p>
        </>
      )}
    </div>
  );
}
