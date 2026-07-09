"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Mic,
  Presentation,
  RotateCcw,
  Send,
  Square,
  XCircle,
} from "lucide-react";
import { Button } from "../../ui";
import { ApiError, apiPost } from "@/lib/client";
import { FeynmanEvaluation, NoteData } from "@/lib/types";

/* Minimal Web Speech typings (shared shape with the recorder). */
interface RecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
function getRecognitionCtor(): (new () => RecognitionLike) | undefined {
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

type Phase = "idle" | "recording" | "review" | "grading" | "result";

export default function FeynmanTab({
  note,
  aiReady,
}: {
  note: NoteData;
  aiReady: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [evaluation, setEvaluation] = useState<FeynmanEvaluation | null>(null);
  const [error, setError] = useState("");

  const recRef = useRef<RecognitionLike | null>(null);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const finalRef = useRef("");

  useEffect(() => {
    setSupported(
      Boolean(getRecognitionCtor())
    );
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const cleanup = () => {
    phaseRef.current = "idle";
    if (timerRef.current) clearInterval(timerRef.current);
    const rec = recRef.current;
    if (rec) {
      rec.onend = null;
      rec.onresult = null;
      rec.onerror = null;
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    }
  };

  const start = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setError("");
    setTranscript("");
    finalRef.current = "";
    setInterim("");
    setEvaluation(null);
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.onresult = (e) => {
      let intr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalRef.current += r[0].transcript + " ";
          setTranscript(finalRef.current);
        } else {
          intr += r[0].transcript;
        }
      }
      setInterim(intr);
    };
    rec.onerror = (ev) => {
      if (ev.error === "not-allowed") {
        setError("Microphone was blocked. Allow mic access and try again.");
        stop();
      }
    };
    rec.onend = () => {
      if (phaseRef.current === "recording") {
        try {
          rec.start();
        } catch {
          /* already running */
        }
      }
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      /* noop */
    }
    startedAtRef.current = Date.now();
    setElapsed(0);
    setPhase("recording");
    phaseRef.current = "recording";
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 500);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const rec = recRef.current;
    if (rec) {
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    }
    setInterim("");
    setPhase("review");
    phaseRef.current = "review";
  };

  const submit = async () => {
    const text = transcript.trim();
    if (text.length < 15) {
      setError("Explain the idea in a few full sentences first.");
      return;
    }
    setPhase("grading");
    setError("");
    try {
      const res = await apiPost<{ evaluation: FeynmanEvaluation }>(
        `/api/notes/${note.id}/feynman`,
        { transcript: text, topic: note.title, durationSec: elapsed }
      );
      setEvaluation(res.evaluation);
      setPhase("result");
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Could not grade your explanation."
      );
      setPhase("review");
    }
  };

  const reset = () => {
    setPhase("idle");
    setTranscript("");
    finalRef.current = "";
    setInterim("");
    setEvaluation(null);
    setError("");
    setElapsed(0);
  };

  const clock = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!aiReady) {
    return (
      <Empty>
        Teach-back grading needs an AI model. Add a provider key and restart to
        practise explaining your notes out loud.
      </Empty>
    );
  }

  /* ---- result ---- */
  if (phase === "result" && evaluation) {
    return (
      <FeynmanResult ev={evaluation} onRetry={reset} />
    );
  }

  /* ---- intro / recording / review ---- */
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Presentation size={24} />
        </div>
        <h3 className="mt-3 font-display text-lg font-extrabold text-ink">
          Teach it back
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
          Explain <span className="font-semibold text-ink">{note.title}</span>{" "}
          out loud, in your own words — as if teaching a friend. Recall grades
          both what you know and <em>how you present it</em>.
        </p>
      </div>

      {!supported && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-sm text-amber-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            Your browser can&apos;t record speech (use Chrome or Edge). You can
            still type your explanation below.
          </span>
        </div>
      )}

      {phase === "idle" && supported && (
        <div className="mt-6 flex flex-col items-center">
          <button
            onClick={start}
            className="animate-pulse-ring flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-ink shadow-lg transition hover:scale-105"
            aria-label="Start explaining"
          >
            <Mic size={30} />
          </button>
          <div className="mt-3 text-sm font-semibold text-muted">
            Tap and start explaining
          </div>
        </div>
      )}

      {phase === "recording" && (
        <div className="mt-6">
          <div className="flex items-center justify-center gap-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-xl font-bold text-ink">
              {clock(elapsed)}
            </span>
          </div>
          <div className="thin-scroll mt-4 max-h-56 overflow-y-auto rounded-xl border border-border bg-surface p-4 text-[15px] leading-7 text-ink">
            {transcript || (
              <span className="text-faint">Listening… start talking.</span>
            )}
            <span className="text-muted">{interim}</span>
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={stop} className="!bg-red-600 hover:!opacity-90">
              <Square size={16} /> Done explaining
            </Button>
          </div>
        </div>
      )}

      {phase === "review" && (
        <div className="mt-6">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Your explanation {elapsed > 0 && `· ${clock(elapsed)}`}
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Explain the concept in your own words…"
            className="min-h-40 w-full resize-y rounded-xl border border-border bg-surface p-4 text-[15px] leading-7 text-ink focus:border-primary focus:outline-none"
          />
          {error && (
            <div className="mt-2 text-sm text-red-600">{error}</div>
          )}
          <div className="mt-4 flex justify-between">
            <Button variant="secondary" onClick={reset}>
              <RotateCcw size={15} /> Start over
            </Button>
            <Button onClick={submit}>
              <Send size={15} /> Grade my explanation
            </Button>
          </div>
        </div>
      )}

      {phase === "grading" && (
        <div className="mt-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted">
            Grading your explanation against the source…
          </p>
        </div>
      )}

      {phase === "idle" && !supported && (
        <div className="mt-6">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type your explanation in your own words…"
            className="min-h-40 w-full resize-y rounded-xl border border-border bg-surface p-4 text-[15px] leading-7 text-ink focus:border-primary focus:outline-none"
          />
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          <div className="mt-3 flex justify-end">
            <Button onClick={submit}>
              <Send size={15} /> Grade my explanation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function scoreColor(n: number): string {
  if (n >= 80) return "text-emerald-600";
  if (n >= 55) return "text-amber-600";
  return "text-red-600";
}
function ringColor(n: number): string {
  if (n >= 80) return "var(--color-emerald-500, #10b981)";
  if (n >= 55) return "#f59e0b";
  return "#ef4444";
}

function FeynmanResult({
  ev,
  onRetry,
}: {
  ev: FeynmanEvaluation;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      {/* score header */}
      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${ringColor(ev.overall)} ${ev.overall * 3.6}deg, var(--surface-2) 0deg)`,
          }}
        >
          <div className="flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-surface">
            <span className={`font-display text-2xl font-extrabold ${scoreColor(ev.overall)}`}>
              {ev.overall}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              score
            </span>
          </div>
        </div>
        <p className="mt-4 max-w-md text-sm leading-6 text-ink">{ev.summary}</p>
      </div>

      {/* content */}
      <section className="mt-5 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-ink">Understanding</h3>
          <div className="flex gap-3 text-xs font-semibold">
            <span className={scoreColor(ev.accuracy)}>
              Accuracy {ev.accuracy}
            </span>
            <span className={scoreColor(ev.completeness)}>
              Completeness {ev.completeness}
            </span>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {ev.covered.length > 0 && (
            <ResultList
              icon={<CheckCircle2 size={15} className="text-emerald-600" />}
              title="You nailed"
              items={ev.covered}
            />
          )}
          {ev.missed.length > 0 && (
            <ResultList
              icon={<AlertCircle size={15} className="text-amber-600" />}
              title="You missed"
              items={ev.missed}
            />
          )}
          {ev.errors.length > 0 && (
            <ResultList
              icon={<XCircle size={15} className="text-red-600" />}
              title="Got wrong / imprecise"
              items={ev.errors}
            />
          )}
        </div>
      </section>

      {/* presentation */}
      <section className="mt-5 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2">
          <Presentation size={16} className="text-accent" />
          <h3 className="font-display font-bold text-ink">
            Presentation &amp; delivery
          </h3>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Metric label="Clarity" value={ev.presentation.clarity} />
          <Metric label="Structure" value={ev.presentation.structure} />
          <Metric label="Conciseness" value={ev.presentation.conciseness} />
        </div>
        {ev.presentation.fillerWords.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-muted">Filler words:</span>
            {ev.presentation.fillerWords.map((f, i) => (
              <span
                key={i}
                className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700"
              >
                {f}
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 text-sm text-muted">
          <span className="font-medium text-ink">Pace:</span>{" "}
          {ev.presentation.pace}
        </p>
        {ev.presentation.tips.length > 0 && (
          <div className="mt-4 rounded-xl bg-accent/8 p-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Lightbulb size={15} className="text-accent" /> Delivery tips
            </div>
            <ul className="mt-2 space-y-1.5">
              {ev.presentation.tips.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-primary">
          Next step
        </div>
        <p className="mt-1 text-sm leading-6 text-ink">{ev.nextStep}</p>
      </div>

      <div className="mt-6 flex justify-center">
        <Button onClick={onRetry}>
          <RotateCcw size={15} /> Explain again
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-3 text-center">
      <div className={`font-display text-xl font-extrabold ${scoreColor(value)}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-muted">{label}</div>
    </div>
  );
}

function ResultList({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        {icon} {title}
      </div>
      <ul className="mt-1.5 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm leading-6 text-muted">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      <Presentation className="mx-auto text-primary" size={36} />
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
        {children}
      </p>
    </div>
  );
}
