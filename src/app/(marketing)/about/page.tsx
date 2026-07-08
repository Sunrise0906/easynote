import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Heart, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "Why we built Recall.",
};

const VALUES = [
  {
    icon: GraduationCap,
    title: "Learning first",
    desc: "Every feature exists to deepen understanding — not to replace it. Notes, quizzes and chat are scaffolding for real mastery.",
  },
  {
    icon: Zap,
    title: "Effort where it matters",
    desc: "Transcribing and reformatting are robot work. We automate the mechanical so you can spend attention on thinking.",
  },
  {
    icon: ShieldCheck,
    title: "Your content is yours",
    desc: "Notes stay private by default, exports are one click away, and nothing is shared unless you create a link.",
  },
  {
    icon: Heart,
    title: "Honest tools",
    desc: "AI output is always grounded in your source and linked back to it, so you can verify anything instantly.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-center text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
        We take the notes.
        <br />
        You do the thinking.
      </h1>
      <div className="mx-auto mt-8 max-w-2xl space-y-4 text-[15px] leading-7 text-muted">
        <p>
          Recall started with a familiar frustration: after a ninety-minute
          lecture, the choice was between three pages of half-legible scribbles
          or two hours of re-watching the recording. Neither was learning —
          both were bookkeeping.
        </p>
        <p>
          So we built the assistant we wished we had: something that listens to
          the lecture, reads the paper, watches the video — and hands back a
          transcript you can search, notes you can trust, flashcards that
          actually test the right things, and a tutor that answers questions
          from the material itself.
        </p>
        <p>
          Today Recall helps students prepare for exams, professionals keep
          up with meetings and webinars, and lifelong learners turn a YouTube
          binge into something that sticks.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {VALUES.map((v) => (
          <div
            key={v.title}
            className="rounded-lg border border-border bg-surface p-6"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <v.icon size={20} />
            </div>
            <div className="mt-3 font-display font-bold text-ink">{v.title}</div>
            <p className="mt-1.5 text-sm leading-6 text-muted">{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-xl border border-border bg-primary/10 px-8 py-10 text-center">
        <h2 className="font-display text-2xl font-extrabold text-ink">
          Learn something today
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Bring one lecture, one meeting or one video — see what it feels like
          when the notes take themselves.
        </p>
        <Link
          href="/login?mode=signup"
          className="mt-6 inline-block rounded-md bg-primary px-7 py-3 text-sm font-bold text-primary-ink transition hover:opacity-90"
        >
          Get started free
        </Link>
      </div>
    </div>
  );
}
