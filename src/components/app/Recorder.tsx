"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CircleAlert, Mic, Pause, Play, Square } from "lucide-react";
import { Button, Field, inputClass } from "../ui";
import { apiPost } from "@/lib/client";
import { TranscriptSegment } from "@/lib/types";

/* Minimal typings for the Web Speech API (not in lib.dom for all targets). */
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<{
          isFinal: boolean;
          0: { transcript: string };
          length: number;
        }>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const LANGS = [
  { code: "en-US", label: "English" },
  { code: "zh-CN", label: "中文 (普通话)" },
  { code: "es-ES", label: "Español" },
  { code: "fr-FR", label: "Français" },
  { code: "de-DE", label: "Deutsch" },
  { code: "ja-JP", label: "日本語" },
  { code: "ko-KR", label: "한국어" },
  { code: "pt-BR", label: "Português" },
  { code: "hi-IN", label: "हिन्दी" },
];

type Phase = "idle" | "recording" | "paused" | "saving" | "saveFailed";

export default function Recorder() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [supported, setSupported] = useState(true);
  const [lang, setLang] = useState("en-US");
  const [title, setTitle] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [level, setLevel] = useState(0);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);
  const pausedAccumRef = useRef(0);
  const pausedAtRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Mirror of segments so finish() can read the freshest value even when the
  // last final result lands after the click (React state is async).
  const segmentsRef = useRef<TranscriptSegment[]>([]);
  // Captured payload for a save that can be retried without re-recording.
  const pendingRef = useRef<{
    segments: TranscriptSegment[];
    durationSec: number;
    audioBlob: Blob | null;
  } | null>(null);

  useEffect(() => {
    setSupported(
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    segmentsRef.current = segments;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [segments, interim]);

  const cleanup = () => {
    // Prevent onend from restarting recognition after we stop it (otherwise
    // the mic keeps capturing after navigating away mid-recording).
    phaseRef.current = "idle";
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
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
    try {
      if (mediaRef.current && mediaRef.current.state !== "inactive") {
        mediaRef.current.stop();
      }
    } catch {
      /* noop */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    void audioCtxRef.current?.close().catch(() => {});
  };

  const currentTime = () =>
    (Date.now() - startedAtRef.current - pausedAccumRef.current) / 1000;

  const attachRecognition = () => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const text = r[0].transcript;
        if (r.isFinal) {
          const t = Math.max(0, currentTime());
          setSegments((prev) => {
            const clean = text.trim();
            if (!clean) return prev;
            const last = prev[prev.length - 1];
            // merge with previous segment if close together and short
            if (last && t - last.start < 20 && (last.text + clean).length < 260) {
              const merged = [...prev];
              merged[merged.length - 1] = {
                ...last,
                end: t,
                text: `${last.text} ${clean}`,
              };
              return merged;
            }
            return [...prev, { start: t, end: t, text: clean }];
          });
        } else {
          interimText += text;
        }
      }
      setInterim(interimText);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") {
        setError(
          "Microphone access was blocked. Allow the mic permission and reload."
        );
        setPhase("idle");
      }
      // "no-speech" and "aborted" are routine — onend restarts.
    };
    rec.onend = () => {
      // Chrome stops recognition every ~60s of silence; restart while recording.
      if (phaseRef.current === "recording") {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      }
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      /* noop */
    }
  };

  const startMeter = (stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setLevel(Math.min(1, avg / 120));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* meter is decorative */
    }
  };

  const start = async () => {
    setError("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(
        "Could not access the microphone. Check your browser permissions."
      );
      return;
    }
    streamRef.current = stream;
    chunksRef.current = [];
    try {
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : undefined;
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start(1000);
      mediaRef.current = mr;
    } catch {
      /* audio capture optional; transcript still works */
    }
    startedAtRef.current = Date.now();
    pausedAccumRef.current = 0;
    setElapsed(0);
    setSegments([]);
    setInterim("");
    setPhase("recording");
    phaseRef.current = "recording";
    attachRecognition();
    startMeter(stream);
    timerRef.current = setInterval(() => {
      if (phaseRef.current === "recording") {
        setElapsed(Math.floor(currentTime()));
      }
    }, 500);
  };

  const pause = () => {
    setPhase("paused");
    phaseRef.current = "paused";
    pausedAtRef.current = Date.now();
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    if (mediaRef.current?.state === "recording") mediaRef.current.pause();
    setInterim("");
  };

  const resume = () => {
    pausedAccumRef.current += Date.now() - pausedAtRef.current;
    setPhase("recording");
    phaseRef.current = "recording";
    if (mediaRef.current?.state === "paused") mediaRef.current.resume();
    attachRecognition();
  };

  // Stop recognition and wait for it to flush the final result (the last
  // spoken sentence arrives via onresult AFTER stop()). Resolves on onend or a
  // short timeout.
  const stopRecognitionAndFlush = () =>
    new Promise<void>((resolve) => {
      const rec = recRef.current;
      if (!rec) return resolve();
      let done = false;
      const finishOnce = () => {
        if (done) return;
        done = true;
        resolve();
      };
      rec.onend = finishOnce;
      try {
        rec.stop();
      } catch {
        finishOnce();
      }
      setTimeout(finishOnce, 900);
    });

  const finish = async () => {
    const wasPaused = phaseRef.current === "paused";
    setPhase("saving");
    phaseRef.current = "saving";
    // If we finish while paused, close out the open pause so it isn't counted
    // as recorded time.
    if (wasPaused && pausedAtRef.current) {
      pausedAccumRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = 0;
    }

    await stopRecognitionAndFlush();

    // flush the MediaRecorder
    const audioBlob = await new Promise<Blob | null>((resolve) => {
      const mr = mediaRef.current;
      if (!mr || mr.state === "inactive") {
        resolve(
          chunksRef.current.length
            ? new Blob(chunksRef.current, { type: "audio/webm" })
            : null
        );
        return;
      }
      mr.onstop = () =>
        resolve(
          chunksRef.current.length
            ? new Blob(chunksRef.current, { type: "audio/webm" })
            : null
        );
      mr.stop();
    });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    // Snapshot the recording so a failed save can be retried as-is.
    pendingRef.current = {
      segments: segmentsRef.current,
      durationSec: Math.max(1, Math.floor(currentTime())),
      audioBlob,
    };
    await saveRecording();
  };

  const saveRecording = async () => {
    const payload = pendingRef.current;
    if (!payload) return;
    setPhase("saving");
    phaseRef.current = "saving";
    setError("");
    try {
      const res = await apiPost<{ note: { id: string } }>("/api/notes", {
        kind: "recording",
        title: title.trim() || undefined,
        durationSec: payload.durationSec,
        segments: payload.segments,
      });
      // Attach the audio so it can be replayed. If this fails the transcript
      // note still exists — tell the user the audio couldn't be saved instead
      // of silently discarding it.
      let audioSaved = true;
      if (payload.audioBlob && payload.audioBlob.size > 0) {
        try {
          const form = new FormData();
          form.append(
            "file",
            new File([payload.audioBlob], "recording.webm", {
              type: "audio/webm",
            })
          );
          form.append("attachTo", res.note.id);
          const up = await fetch("/api/upload", {
            method: "POST",
            body: form,
          });
          audioSaved = up.ok;
        } catch {
          audioSaved = false;
        }
      }
      pendingRef.current = null;
      if (!audioSaved) {
        // Persist the note but let the user know playback won't be available.
        router.push(`/notes/${res.note.id}?audio=failed`);
      } else {
        router.push(`/notes/${res.note.id}`);
      }
    } catch (e) {
      setError(
        (e instanceof Error ? e.message : "Could not save recording.") +
          " Your transcript is safe — tap Retry save."
      );
      setPhase("saveFailed");
      phaseRef.current = "saveFailed";
    }
  };

  const clock = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = String(s % 60).padStart(2, "0");
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}:${String(m % 60).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Live recording</h1>
      <p className="mt-1 text-sm text-slate-500">
        Speech is transcribed in your browser as you talk — the audio is saved
        with the note so you can replay any moment.
      </p>

      {!supported && (
        <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <CircleAlert size={17} className="mt-0.5 shrink-0" />
          <span>
            This browser doesn&apos;t support live speech recognition. Use{" "}
            <strong>Chrome</strong> or <strong>Edge</strong>, or upload an
            audio file from the dashboard instead.
          </span>
        </div>
      )}

      {phase === "idle" && (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Note title (optional)">
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Biology lecture 12"
              />
            </Field>
            <Field label="Spoken language">
              <select
                className={inputClass}
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-8 flex flex-col items-center">
            <button
              onClick={start}
              disabled={!supported}
              className="animate-pulse-ring flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xl transition hover:scale-105 disabled:opacity-40"
              aria-label="Start recording"
            >
              <Mic size={36} />
            </button>
            <div className="mt-4 text-sm font-semibold text-slate-600">
              Tap to start recording
            </div>
          </div>
        </div>
      )}

      {phase !== "idle" && (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          {/* status row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${phase === "recording" ? "animate-pulse bg-rose-500" : "bg-amber-400"}`}
              />
              <span className="font-mono text-2xl font-bold text-slate-900">
                {clock(elapsed)}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {phase === "recording"
                  ? "Recording"
                  : phase === "paused"
                    ? "Paused"
                    : phase === "saveFailed"
                      ? "Save failed"
                      : "Saving…"}
              </span>
            </div>
            {/* level meter */}
            <div className="flex h-8 items-end gap-1">
              {[...Array(7)].map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 rounded-full bg-brand-500 transition-all duration-100"
                  style={{
                    height: `${
                      phase === "recording"
                        ? 6 + level * 26 * ((i % 3) + 1) * 0.5
                        : 6
                    }px`,
                    opacity: phase === "recording" ? 0.4 + level * 0.6 : 0.25,
                  }}
                />
              ))}
            </div>
          </div>

          {/* live transcript */}
          <div
            ref={scrollRef}
            className="thin-scroll mt-6 h-64 overflow-y-auto rounded-2xl bg-slate-50 p-4"
          >
            {segments.length === 0 && !interim && (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                {phase === "recording"
                  ? "Listening… start speaking"
                  : "Paused"}
              </div>
            )}
            <div className="space-y-2.5">
              {segments.map((s, i) => (
                <p key={i} className="text-[15px] leading-7 text-slate-700">
                  <span className="mr-2 font-mono text-[11px] font-semibold text-brand-500">
                    {clock(Math.floor(s.start))}
                  </span>
                  {s.text}
                </p>
              ))}
              {interim && (
                <p className="text-[15px] leading-7 text-slate-400">
                  {interim}
                </p>
              )}
            </div>
          </div>

          {/* controls */}
          <div className="mt-6 flex items-center justify-center gap-3">
            {phase === "saveFailed" ? (
              <Button
                onClick={saveRecording}
                className="!bg-rose-600 !px-5 !py-2.5 hover:!bg-rose-700"
              >
                <Square size={16} /> Retry save
              </Button>
            ) : (
              <>
                {phase === "recording" ? (
                  <Button
                    variant="secondary"
                    onClick={pause}
                    className="!px-5 !py-2.5"
                  >
                    <Pause size={17} /> Pause
                  </Button>
                ) : phase === "paused" ? (
                  <Button
                    variant="secondary"
                    onClick={resume}
                    className="!px-5 !py-2.5"
                  >
                    <Play size={17} /> Resume
                  </Button>
                ) : null}
                <Button
                  onClick={finish}
                  loading={phase === "saving"}
                  disabled={segments.length === 0 && phase !== "saving"}
                  className="!bg-rose-600 !px-5 !py-2.5 hover:!bg-rose-700"
                >
                  <Square size={16} /> Finish &amp; create note
                </Button>
              </>
            )}
          </div>
          {segments.length === 0 && phase === "recording" && (
            <p className="mt-3 text-center text-xs text-slate-400">
              The finish button unlocks once some speech has been transcribed.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
