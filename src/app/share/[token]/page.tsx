import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { findNoteByShareToken } from "@/lib/store";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Shared note" };

function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const note = await findNoteByShareToken(token);
  if (!note) notFound();

  const isTimed = ["youtube", "audio", "video", "recording"].includes(
    note.sourceType
  );

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link
            href="/login?mode=signup"
            className="rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-ink hover:opacity-90"
          >
            Make your own notes free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="text-xs font-bold uppercase tracking-wider text-muted">
          Shared note · read-only
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">
          {note.emoji} {note.title}
        </h1>

        {note.youtubeId && (
          <div className="mt-6 overflow-hidden rounded-lg border border-border bg-black">
            <div className="relative aspect-video w-full">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${note.youtubeId}?rel=0`}
                title={note.title}
                allowFullScreen
              />
            </div>
          </div>
        )}

        {note.summary && (
          <div className="mt-6 rounded-lg border border-accent/40 bg-accent/10 p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-accent">
              Summary
            </div>
            <p className="mt-1.5 leading-7 text-ink">{note.summary}</p>
            {note.keyPoints && note.keyPoints.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {note.keyPoints.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {note.notesMarkdown && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-6 sm:p-8">
            <div className="md-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.notesMarkdown}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {note.transcript.length > 0 && (
          <details className="mt-6 rounded-lg border border-border bg-surface p-6">
            <summary className="cursor-pointer font-display font-bold text-ink">
              Transcript ({note.transcript.length} segments)
            </summary>
            <div className="mt-4 space-y-3">
              {note.transcript.map((s, i) => (
                <p key={i} className="flex gap-3 text-[15px] leading-7 text-ink">
                  {(isTimed || note.sourceType === "pdf") && (
                    <span className="mt-1 h-fit shrink-0 rounded bg-surface-2 px-1.5 font-mono text-[11px] font-semibold text-muted">
                      {note.sourceType === "pdf"
                        ? `p.${s.start}`
                        : clock(s.start)}
                    </span>
                  )}
                  <span>{s.text}</span>
                </p>
              ))}
            </div>
          </details>
        )}

        <div className="mt-10 rounded-lg bg-primary p-8 text-center">
          <div className="font-display text-xl font-extrabold text-primary-ink">
            Notes like this, from anything you're learning
          </div>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-primary-ink/80">
            Record a lecture, paste a YouTube link or upload a PDF — Recall
            writes the notes, flashcards and quiz for you.
          </p>
          <Link
            href="/login?mode=signup"
            className="mt-5 inline-block rounded-md bg-primary-ink px-6 py-2.5 text-sm font-bold text-primary"
          >
            Try Recall free
          </Link>
        </div>
      </main>
    </div>
  );
}
