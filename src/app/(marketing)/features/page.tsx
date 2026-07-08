import type { Metadata } from "next";
import Link from "next/link";
import {
  AudioLines,
  BookOpenCheck,
  Brain,
  Download,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Languages,
  Link2,
  ListChecks,
  MessageCircleQuestion,
  Mic,
  Network,
  NotebookPen,
  Share2,
  Sparkles,
  PlayCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Everything Recall can do: live recording, file transcription, YouTube notes, PDF and image import, flashcards, quizzes, mind maps, chat, translation and more.",
};

const GROUPS: {
  heading: string;
  sub: string;
  items: { icon: React.ElementType; title: string; desc: string }[];
}[] = [
  {
    heading: "Capture from any source",
    sub: "Recall meets your knowledge wherever it lives.",
    items: [
      {
        icon: Mic,
        title: "Live recording",
        desc: "Hit record in a lecture or meeting and watch the transcript appear in real time — right in your browser, on the free plan.",
      },
      {
        icon: AudioLines,
        title: "Audio & video transcription",
        desc: "Upload recordings (mp3, m4a, wav, mp4, mov…) and get an accurate, time-stamped transcript you can search and click through.",
      },
      {
        icon: PlayCircle,
        title: "YouTube video notes",
        desc: "Paste any link. Recall pulls the transcript, keeps the video attached for playback, and writes complete notes.",
      },
      {
        icon: FileText,
        title: "PDF understanding",
        desc: "Research papers, textbooks and reports are read page by page — including scanned documents via AI vision.",
      },
      {
        icon: ImageIcon,
        title: "Image to notes",
        desc: "Slides, whiteboards, handwritten pages: photograph them and the AI transcribes and organizes the content.",
      },
      {
        icon: NotebookPen,
        title: "Paste anything",
        desc: "Articles, messy class notes, meeting minutes — paste raw text and get it back clean and structured.",
      },
    ],
  },
  {
    heading: "Understand faster",
    sub: "Every note is a complete, connected study space.",
    items: [
      {
        icon: Sparkles,
        title: "Structured AI notes",
        desc: "An overview, logically organized sections with bolded key terms, and key takeaways — in the language of your source.",
      },
      {
        icon: BookOpenCheck,
        title: "Source-linked transcript",
        desc: "Click any transcript line to jump to that second of the recording or that page of the document. Never lose the source of a claim.",
      },
      {
        icon: MessageCircleQuestion,
        title: "AI chat tutor",
        desc: "Ask follow-up questions, request examples, or have concepts re-explained — answers are grounded in your note's actual content.",
      },
      {
        icon: Languages,
        title: "Translate in one click",
        desc: "Turn any note into 15+ languages while keeping the structure intact. Study in the language you think in.",
      },
    ],
  },
  {
    heading: "Remember longer",
    sub: "Built-in study tools turn notes into knowledge.",
    items: [
      {
        icon: Brain,
        title: "Flashcards",
        desc: "One-concept-per-card decks generated from your material. Flip, shuffle, and regenerate for fresh angles.",
      },
      {
        icon: ListChecks,
        title: "Quizzes with explanations",
        desc: "Multiple-choice questions with instant scoring and an explanation for every answer, so wrong answers still teach you.",
      },
      {
        icon: Network,
        title: "Interactive mind maps",
        desc: "Your note's structure as a zoomable, collapsible map — perfect for seeing the big picture before an exam.",
      },
    ],
  },
  {
    heading: "Stay organized",
    sub: "Your knowledge library, under control.",
    items: [
      {
        icon: FolderKanban,
        title: "Folders & search",
        desc: "Group notes by course or project and find anything instantly.",
      },
      {
        icon: Share2,
        title: "Share with a link",
        desc: "Publish a read-only version of any note for classmates or teammates — revoke access anytime.",
      },
      {
        icon: Download,
        title: "Export everywhere",
        desc: "Download notes as Markdown or plain text, and transcripts with timestamps.",
      },
      {
        icon: Link2,
        title: "Media stays attached",
        desc: "The original video or audio lives inside the note, synced to the transcript.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Every feature, built for learning
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          Recall is a complete pipeline from raw information to lasting
          understanding. Here&apos;s everything inside.
        </p>
      </div>

      {GROUPS.map((g) => (
        <section key={g.heading} className="mt-16">
          <h2 className="font-display text-2xl font-extrabold text-ink">
            {g.heading}
          </h2>
          <p className="mt-1 text-muted">{g.sub}</p>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-border bg-surface p-6 transition hover:border-ink/25 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <f.icon size={20} />
                </div>
                <div className="mt-3.5 font-display font-bold text-ink">{f.title}</div>
                <p className="mt-1.5 text-sm leading-6 text-muted">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-20 rounded-xl border border-border bg-primary px-8 py-12 text-center">
        <h2 className="font-display text-2xl font-extrabold text-primary-ink sm:text-3xl">
          Try every feature free
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-primary-ink/80">
          The Starter plan includes the full toolkit — 10 AI notes a month, no
          credit card.
        </p>
        <Link
          href="/login?mode=signup"
          className="mt-6 inline-block rounded-md bg-bg px-8 py-3 text-sm font-bold text-ink transition hover:opacity-90"
        >
          Start taking better notes
        </Link>
      </div>
    </div>
  );
}
