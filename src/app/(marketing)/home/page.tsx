import type { Metadata } from "next";
import Link from "next/link";
import {
  AudioLines,
  BookOpenCheck,
  Brain,
  FileText,
  Image as ImageIcon,
  Languages,
  ListChecks,
  MessageCircleQuestion,
  Mic,
  Network,
  NotebookPen,
  Sparkles,
  CirclePlay,
} from "lucide-react";
import PricingSection from "@/components/marketing/PricingSection";
import FAQList from "@/components/marketing/FAQList";

export const metadata: Metadata = {
  title: "EasyNote: AI Note-Taking Assistant — Notes, Flashcards & Summaries",
  description:
    "Turn audio, video, YouTube links, PDFs and images into structured notes, summaries, flashcards, quizzes, mind maps and an AI tutor you can chat with.",
};

const INPUTS = [
  {
    icon: Mic,
    title: "Record live",
    desc: "Capture lectures and meetings with real-time transcription right in your browser.",
  },
  {
    icon: AudioLines,
    title: "Audio & video files",
    desc: "Upload mp3, m4a, wav, mp4 and more — we transcribe every word with timestamps.",
  },
  {
    icon: CirclePlay,
    title: "YouTube links",
    desc: "Paste a link and get the full transcript plus organized notes in minutes.",
  },
  {
    icon: FileText,
    title: "PDF documents",
    desc: "Textbooks, papers and reports become clean, structured study notes.",
  },
  {
    icon: ImageIcon,
    title: "Images & slides",
    desc: "Photograph a whiteboard or slide — the AI reads it and takes the notes.",
  },
  {
    icon: NotebookPen,
    title: "Pasted text",
    desc: "Drop in any article or raw notes and let the AI restructure them for you.",
  },
];

const TOOLS = [
  {
    icon: Sparkles,
    title: "AI Notes & Summaries",
    desc: "Every source becomes an overview, key takeaways, and detailed structured notes in Markdown — editable and exportable.",
  },
  {
    icon: BookOpenCheck,
    title: "Time-stamped Transcript",
    desc: "Full transcripts broken into readable paragraphs. Click any line to jump to that exact moment in the audio or video.",
  },
  {
    icon: Brain,
    title: "Flashcards",
    desc: "Auto-generated decks that test one concept per card. Flip, shuffle and mark what you know.",
  },
  {
    icon: ListChecks,
    title: "Quizzes",
    desc: "Multiple-choice questions with instant feedback and explanations, so you know exactly what to review.",
  },
  {
    icon: Network,
    title: "Mind Maps",
    desc: "See the structure of any topic at a glance with an interactive mind map built from your notes.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Chat with your notes",
    desc: "Ask questions and get answers grounded in your material — like office hours, any time.",
  },
];

const TESTIMONIALS = [
  {
    name: "Maya R.",
    role: "Pre-med student",
    quote:
      "I record every lecture and EasyNote hands me the notes, the flashcards and a quiz before I've even left the building. My review time dropped in half.",
  },
  {
    name: "Daniel K.",
    role: "Product manager",
    quote:
      "Meeting recordings go in, action-ready summaries come out. Chatting with past meetings to find decisions is the feature I didn't know I needed.",
  },
  {
    name: "Xinyi L.",
    role: "Graduate researcher",
    quote:
      "Fifty-page papers become structured notes with key points in minutes, and the translation feature lets me study them in my native language.",
  },
];

const HOME_FAQ = [
  {
    q: "What can I turn into notes?",
    a: "Live recordings, uploaded audio and video files, YouTube links, PDF documents, images (slides, whiteboards, book pages) and pasted text. Every source becomes a transcript plus structured AI notes.",
  },
  {
    q: "How accurate are the notes?",
    a: "Notes are generated from the actual transcript or document text, and every note keeps its source content attached so you can verify anything in one click. You can also edit the notes directly.",
  },
  {
    q: "Does it work in my language?",
    a: "Yes. Notes are generated in the language of your source material, and you can translate any note into 15+ languages including Chinese, Spanish, Japanese and French.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes — the Starter plan includes 10 AI notes per month, flashcards, quizzes, mind maps and AI chat, free forever. Upgrade to Pro when you need unlimited notes.",
  },
  {
    q: "Can I share my notes?",
    a: "Every note can be shared with a read-only public link, and exported as Markdown, plain text or a transcript file.",
  },
];

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-14 max-w-4xl">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-r from-brand-200/60 via-fuchsia-100 to-sky-100 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-brand-100">
        {/* window chrome */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-3 text-xs text-slate-400">
            EasyNote — Cognitive Biases, Lecture 4
          </span>
        </div>
        <div className="grid md:grid-cols-[1.25fr_1fr]">
          {/* notes side */}
          <div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r">
            <div className="flex gap-2 text-[11px] font-semibold">
              <span className="rounded-full bg-brand-600 px-2.5 py-1 text-white">
                Notes
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">
                Transcript
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">
                Chat
              </span>
            </div>
            <div className="mt-4 space-y-2 text-left">
              <div className="text-sm font-bold text-slate-900">
                ## Anchoring effect
              </div>
              <div className="h-2 w-11/12 rounded bg-slate-100" />
              <div className="h-2 w-4/5 rounded bg-slate-100" />
              <div className="flex items-center gap-2 pt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                <div className="h-2 w-3/4 rounded bg-brand-100" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                <div className="h-2 w-2/3 rounded bg-brand-100" />
              </div>
              <div className="pt-2 text-sm font-bold text-slate-900">
                ## Confirmation bias
              </div>
              <div className="h-2 w-10/12 rounded bg-slate-100" />
              <div className="h-2 w-3/5 rounded bg-slate-100" />
            </div>
          </div>
          {/* study tools side */}
          <div className="grid gap-3 p-5">
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-left">
              <div className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                Flashcard 3/12
              </div>
              <div className="mt-1.5 text-sm font-semibold text-slate-800">
                What is the anchoring effect?
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Tap to reveal answer ↺
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3.5 text-left">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Quiz
              </div>
              <div className="mt-1.5 text-xs font-medium text-slate-700">
                Which bias explains sticking to first impressions?
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700">
                  ✓ Anchoring
                </div>
                <div className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-500">
                  Framing
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3.5 text-left">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Ask AI
              </div>
              <div className="mt-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] text-slate-600">
                Explain it with a shopping example…
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,#ece5ff_0%,rgba(255,255,255,0)_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-sm">
            <Sparkles size={14} />
            Your AI note-taking assistant
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Stop taking notes.
            <br />
            <span className="bg-gradient-to-r from-brand-600 via-fuchsia-600 to-sky-600 bg-clip-text text-transparent">
              Start understanding.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            EasyNote turns lectures, meetings, YouTube videos, PDFs and images
            into structured notes, flashcards, quizzes, mind maps and an AI
            tutor you can ask anything.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login?mode=signup"
              className="w-full rounded-xl bg-brand-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700 sm:w-auto"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/features"
              className="w-full rounded-xl border border-slate-300 bg-white px-7 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            No credit card required · Works with 15+ languages
          </p>
          <HeroPreview />
        </div>
      </section>

      {/* INPUT TYPES */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Capture knowledge from anywhere
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          One inbox for everything you learn — no matter the format.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INPUTS.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <f.icon size={22} />
              </div>
              <div className="mt-4 font-bold text-slate-900">{f.title}</div>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            From raw material to mastery in three steps
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                n: "1",
                t: "Add your source",
                d: "Record live, upload a file, or paste a YouTube link. Processing starts immediately.",
              },
              {
                n: "2",
                t: "Get instant notes",
                d: "A clean transcript plus structured notes with an overview, sections and key takeaways.",
              },
              {
                n: "3",
                t: "Study smarter",
                d: "Generate flashcards, quiz yourself, explore the mind map, or chat with an AI tutor that knows your material.",
              },
            ].map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-white p-7 shadow-sm">
                <div className="absolute -top-4 left-7 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-extrabold text-white shadow-md">
                  {s.n}
                </div>
                <div className="mt-3 font-bold text-slate-900">{s.t}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STUDY TOOLS */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          A complete study toolkit, generated for you
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                  <f.icon size={20} />
                </div>
                <div className="font-bold text-slate-900">{f.title}</div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 px-6 py-4 text-sm text-brand-800">
          <Languages size={18} />
          <span>
            <strong>Study in any language</strong> — translate notes and
            summaries into 15+ languages with one click.
          </span>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-gradient-to-b from-white to-brand-50/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Loved by students and professionals
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="text-amber-400">★★★★★</div>
                <blockquote className="mt-3 text-sm leading-6 text-slate-700">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-slate-900">{t.name}</span>
                  <span className="text-slate-500"> · {t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" id="pricing">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Simple, honest pricing
        </h2>
        <p className="mx-auto mb-10 mt-3 max-w-xl text-center text-slate-600">
          Start free. Upgrade when your notes can&apos;t keep up with you.
        </p>
        <PricingSection compact />
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Frequently asked questions
        </h2>
        <div className="mt-8">
          <FAQList items={HOME_FAQ} />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-fuchsia-600 px-8 py-14 text-center shadow-xl">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to learn twice as fast?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Join learners who let EasyNote handle the note-taking so they can
            focus on understanding.
          </p>
          <Link
            href="/login?mode=signup"
            className="mt-7 inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-brand-700 shadow-lg transition hover:bg-brand-50"
          >
            Create your free account
          </Link>
        </div>
      </section>
    </>
  );
}
