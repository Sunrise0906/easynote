"use client";

import { MutableRefObject, useMemo, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import { Button } from "../../ui";
import { NoteData } from "@/lib/types";

function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${sec}`
    : `${m}:${sec}`;
}

export default function TranscriptTab({
  note,
  seekRef,
}: {
  note: NoteData;
  seekRef: MutableRefObject<((t: number) => void) | null>;
}) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const isTimed = ["youtube", "audio", "video", "recording"].includes(
    note.sourceType
  );
  const isPdf = note.sourceType === "pdf";
  const canSeek = isTimed && (note.youtubeId || note.mediaFile);

  const segments = useMemo(() => {
    if (!query.trim()) return note.transcript;
    const q = query.toLowerCase();
    return note.transcript.filter((s) => s.text.toLowerCase().includes(q));
  }, [note.transcript, query]);

  const copyAll = async () => {
    const text = note.transcript
      .map((s) =>
        isTimed
          ? `[${clock(s.start)}] ${s.text}`
          : isPdf
            ? `[Page ${s.start}] ${s.text}`
            : s.text
      )
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcript…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none"
          />
        </div>
        <Button variant="ghost" onClick={copyAll} className="!px-3 !py-1.5">
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy all"}
        </Button>
      </div>

      {canSeek && (
        <p className="mb-3 text-xs text-slate-400">
          Tip: click a timestamp to jump to that moment.
        </p>
      )}

      <div className="space-y-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        {segments.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-400">
            No matches for “{query}”.
          </div>
        )}
        {segments.map((s, i) => (
          <div
            key={i}
            className="group flex gap-4 rounded-xl px-2 py-2 transition hover:bg-brand-50/60"
          >
            {(isTimed || isPdf) && (
              <button
                onClick={() => canSeek && seekRef.current?.(s.start)}
                disabled={!canSeek}
                className={`h-fit shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
                  canSeek
                    ? "bg-brand-100 text-brand-700 transition hover:bg-brand-600 hover:text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
                title={canSeek ? "Jump to this moment" : undefined}
              >
                {isPdf ? `p.${s.start}` : clock(s.start)}
              </button>
            )}
            <p className="text-[15px] leading-7 text-slate-700">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
