import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  AudioLines,
  Brain,
  FileText,
  Image as ImageIcon,
  ListChecks,
  MessageCircle,
  Mic,
  Network,
  NotebookPen,
  PlayCircle,
  Presentation,
  Repeat,
} from "lucide-react";
import PricingSection from "@/components/marketing/PricingSection";
import FAQList from "@/components/marketing/FAQList";
import ThemeShowcase from "@/components/marketing/ThemeShowcase";

export const metadata: Metadata = {
  title: "Recall — remember what you learn",
  description:
    "Recall turns lectures, meetings, YouTube, PDFs and images into structured notes, flashcards, quizzes, mind maps and a chat tutor — so it actually sticks.",
};

const STUDY_TOOLS = [
  {
    icon: NotebookPen,
    title: "Structured notes",
    body: "Every source becomes an overview, key points and section-by-section notes — in its own language, editable and exportable.",
    demo: (
      <div className="space-y-2">
        <div className="h-3 w-2/3 rounded bg-ink/80" />
        <div className="h-2 w-full rounded bg-ink/15" />
        <div className="h-2 w-11/12 rounded bg-ink/15" />
        <div className="mt-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <div className="h-2 w-3/4 rounded bg-primary/25" />
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <div className="h-2 w-2/3 rounded bg-primary/25" />
        </div>
      </div>
    ),
  },
  {
    icon: Brain,
    title: "Flashcards & quizzes",
    body: "Spaced-repetition decks and multiple-choice quizzes with explanations, generated from your material — so review time is retrieval, not rereading.",
    demo: (
      <div className="grid gap-2">
        <div className="rounded-md border border-primary/40 bg-primary/8 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-primary">
            Card 3 / 12
          </div>
          <div className="mt-1 text-sm font-semibold text-ink">
            What is the anchoring effect?
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 rounded-md border border-accent/50 bg-accent/10 px-3 py-2 text-xs font-medium text-ink">
            ✓ Correct
          </div>
          <div className="flex-1 rounded-md border border-border px-3 py-2 text-xs text-muted">
            Try again
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: MessageCircle,
    title: "Chat tutor + mind map",
    body: "Ask questions and get answers grounded in the material, or step back and see the whole topic as a mind map. Office hours, any hour.",
    demo: (
      <div className="space-y-2">
        <div className="ml-auto w-fit max-w-[80%] rounded-lg rounded-br-sm bg-primary px-3 py-1.5 text-xs text-primary-ink">
          Explain it with an example
        </div>
        <div className="w-fit max-w-[85%] rounded-lg rounded-bl-sm bg-surface-2 px-3 py-1.5 text-xs text-ink">
          Sure — when you see a $1,200 watch first, a $400 one feels cheap…
        </div>
      </div>
    ),
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I record every lecture and Recall hands me the notes, a deck and a quiz before I've left the building. Review time roughly halved.",
    name: "Maya R.",
    role: "Pre-med student",
  },
  {
    quote:
      "Meetings go in, decisions come out. Asking a three-week-old meeting why we chose a vendor — and getting the timestamp — is the feature I didn't know I needed.",
    name: "Daniel K.",
    role: "Product manager",
  },
];

const HOME_FAQ = [
  {
    q: "What can I turn into notes?",
    a: "Live recordings, uploaded audio and video, YouTube links, PDFs, images (slides, whiteboards, book pages) and pasted text. Each becomes a transcript plus structured notes.",
  },
  {
    q: "Are the notes trustworthy?",
    a: "Notes are generated from the actual transcript or document, and every note keeps its source attached so you can verify any claim in one click. You can also edit them directly.",
  },
  {
    q: "Does it work in my language?",
    a: "Yes. Notes are written in the language of your source, and you can translate any note into 15+ languages including Chinese, Spanish, Japanese and French.",
  },
  {
    q: "What are the four themes?",
    a: "Recall ships four distinct visual designs — Swiss, Midnight, Editorial and Botanic — that you switch anytime from the top bar. They restyle the whole app instantly; your notes are untouched.",
  },
];

const SOURCES = [
  { icon: Mic, label: "Live recording", note: "real-time transcript" },
  { icon: AudioLines, label: "Audio & video", note: "mp3, m4a, mp4…" },
  { icon: PlayCircle, label: "YouTube", note: "paste a link" },
  { icon: FileText, label: "PDF", note: "incl. scanned" },
  { icon: ImageIcon, label: "Images", note: "slides, whiteboards" },
  { icon: NotebookPen, label: "Pasted text", note: "articles, notes" },
];

export default function HomePage() {
  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Notes, flashcards, quizzes & a tutor — from anything
            </div>
            <h1 className="font-display mt-5 text-[clamp(2.6rem,6vw,4.4rem)] font-bold leading-[1.02] text-ink">
              Stop re-watching.
              <br />
              Start remembering.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
              Recall listens to the lecture, reads the paper, watches the video
              — and hands back notes you can trust, flashcards that test the
              right things, and a tutor that knows your material.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-ink transition hover:opacity-90"
              >
                Start free <ArrowUpRight size={16} />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted">
              No credit card · four themes · 15+ languages
            </p>
          </div>

          {/* app preview mock */}
          <div className="animate-fade-up relative" style={{ animationDelay: "80ms" }}>
            <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-faint" />
                <span className="h-2.5 w-2.5 rounded-full bg-faint" />
                <span className="h-2.5 w-2.5 rounded-full bg-faint" />
                <span className="ml-3 font-mono text-[11px] text-muted">
                  Cognitive Biases · Lecture 4
                </span>
              </div>
              <div className="grid grid-cols-[1.3fr_1fr]">
                <div className="border-r border-border p-5">
                  <div className="mb-3 flex gap-1.5 text-[10px] font-semibold">
                    <span className="rounded bg-primary px-2 py-1 text-primary-ink">
                      Notes
                    </span>
                    <span className="rounded bg-surface-2 px-2 py-1 text-muted">
                      Transcript
                    </span>
                    <span className="rounded bg-surface-2 px-2 py-1 text-muted">
                      Chat
                    </span>
                  </div>
                  <div className="font-display text-sm font-bold text-ink">
                    Anchoring effect
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-2 w-full rounded bg-ink/10" />
                    <div className="h-2 w-4/5 rounded bg-ink/10" />
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <div className="h-2 w-3/4 rounded bg-primary/25" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <div className="h-2 w-2/3 rounded bg-primary/25" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="rounded-md border border-primary/40 bg-primary/8 p-3">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-primary">
                      Flashcard
                    </div>
                    <div className="mt-1 text-xs font-semibold text-ink">
                      What is anchoring?
                    </div>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-muted">
                      Quiz
                    </div>
                    <div className="mt-1.5 rounded border border-accent/50 bg-accent/10 px-2 py-1 text-[10px] font-medium text-ink">
                      ✓ Anchoring
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SOURCES (bento) ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            One inbox for everything you learn
          </h2>
          <p className="mt-3 text-muted">
            However the knowledge arrives, it comes out the same way: clean,
            structured and searchable.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SOURCES.map((s, i) => (
            <div
              key={s.label}
              className={`group rounded-lg border border-border bg-surface p-5 transition hover:border-ink/25 ${
                i === 0 ? "sm:col-span-2 lg:col-span-2 lg:row-span-1" : ""
              }`}
            >
              <s.icon
                size={22}
                className="text-primary transition group-hover:scale-110"
              />
              <div className="mt-3 font-display font-semibold text-ink">
                {s.label}
              </div>
              <div className="mt-0.5 text-xs text-muted">{s.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- THE WEDGE: memory system ---------------- */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Brain size={13} /> Why it&apos;s called Recall
            </div>
            <h2 className="font-display mt-4 text-3xl font-bold text-ink sm:text-4xl">
              Other apps stop at notes.
              <br />
              Recall makes it stick.
            </h2>
            <p className="mt-3 leading-7 text-muted">
              Generating flashcards is the easy part — everyone does it. Recall
              owns the part that actually builds memory: it schedules your
              reviews, shows you what you&apos;re forgetting, and makes you prove
              you understand by teaching it back.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Repeat,
                title: "Spaced repetition, automatic",
                body: "Every flashcard across all your notes enters one daily queue, scheduled by FSRS — the same algorithm Anki uses — to resurface each card right before you'd forget it.",
              },
              {
                icon: Activity,
                title: "A memory dashboard",
                body: "See your true retention, which notes are mastered, and exactly what's slipping — a live map of what's in your head, not just what you saved.",
              },
              {
                icon: Presentation,
                title: "Teach-back (Feynman mode)",
                body: "Explain a topic out loud. Recall grades your understanding against the source AND coaches your delivery — structure, clarity, filler words. Learn it and present it.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-border bg-bg p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <f.icon size={22} />
                </div>
                <h3 className="font-display mt-4 text-lg font-semibold text-ink">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- STUDY TOOLS (alternating rows) ---------------- */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display max-w-2xl text-3xl font-bold text-ink sm:text-4xl">
            A whole study toolkit, made for you
          </h2>
          <div className="mt-12 space-y-14">
            {STUDY_TOOLS.map((t, i) => (
              <div
                key={t.title}
                className="grid items-center gap-8 md:grid-cols-2"
              >
                <div className={i % 2 === 1 ? "md:order-2" : ""}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <t.icon size={22} />
                  </div>
                  <h3 className="font-display mt-4 text-xl font-semibold text-ink">
                    {t.title}
                  </h3>
                  <p className="mt-2 max-w-md leading-7 text-muted">{t.body}</p>
                </div>
                <div
                  className={`rounded-lg border border-border bg-bg p-6 ${i % 2 === 1 ? "md:order-1" : ""}`}
                >
                  {t.demo}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- THEMES (signature, interactive) ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Four designs. Your call.
          </h2>
          <p className="mt-3 text-muted">
            Recall isn&apos;t one look with a dark switch. Pick a whole design
            language — and yes, this page changes too. Try one:
          </p>
        </div>
        <div className="mt-10">
          <ThemeShowcase />
        </div>
      </section>

      {/* ---------------- HOW IT WORKS (real sequence) ---------------- */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            From raw to remembered, in three moves
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                n: "1",
                t: "Add a source",
                d: "Record live, upload a file, or paste a link. Processing starts immediately.",
              },
              {
                n: "2",
                t: "Get your notes",
                d: "A clean transcript plus structured notes with an overview and key takeaways.",
              },
              {
                n: "3",
                t: "Make it stick",
                d: "Generate flashcards, quiz yourself, explore the mind map, ask the tutor.",
              },
            ].map((s) => (
              <li key={s.n} className="border-t-2 border-primary pt-5">
                <div className="font-display text-4xl font-bold text-primary">
                  {s.n}
                </div>
                <div className="font-display mt-2 text-lg font-semibold text-ink">
                  {s.t}
                </div>
                <p className="mt-1.5 text-sm leading-6 text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-lg border border-border bg-surface p-7"
            >
              <div className="text-accent">★★★★★</div>
              <blockquote className="mt-3 flex-1 text-lg leading-8 text-ink">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="font-semibold text-ink">{t.name}</span>
                <span className="text-muted"> · {t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------------- PRICING ---------------- */}
      <section className="border-t border-border bg-surface py-20" id="pricing">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
              Honest pricing
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted">
              Start free. Upgrade when your notes can&apos;t keep up with you.
            </p>
          </div>
          <div className="mt-10">
            <PricingSection compact />
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-center text-3xl font-bold text-ink">
          Questions
        </h2>
        <div className="mt-8">
          <FAQList items={HOME_FAQ} />
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="rounded-xl border border-border bg-primary px-8 py-16 text-center">
          <h2 className="font-display text-3xl font-bold text-primary-ink sm:text-4xl">
            Learn it once. Keep it.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-primary-ink/80">
            Bring one lecture, meeting or video and see what it feels like when
            the notes take themselves.
          </p>
          <Link
            href="/login?mode=signup"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-bg px-7 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
          >
            Create your free account <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
