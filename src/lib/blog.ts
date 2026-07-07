export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readMinutes: number;
  emoji: string;
  body: string; // Markdown
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "stop-transcribing-start-thinking",
    title: "Stop transcribing, start thinking: why hand-written lecture notes fail",
    excerpt:
      "Typing every word a professor says feels productive — and quietly destroys comprehension. Here's what the research on note-taking actually suggests, and a workflow that fixes it.",
    date: "2026-06-18",
    readMinutes: 6,
    emoji: "🧠",
    body: `## The transcription trap

When you try to capture a lecture word-for-word, your working memory spends itself on *hearing and typing* instead of *understanding*. You leave the room with pages of text and, often, no mental model at all.

Researchers call the alternative **generative note-taking**: paraphrasing, connecting, questioning. It's slower per word — and far better per idea.

## Why we transcribe anyway

Because we're afraid of losing something. If a detail might be on the exam, writing it down feels safer than trusting ourselves to judge what matters in real time.

That fear is legitimate. The solution isn't to try harder — it's to **split the job in two**:

1. Let a machine capture *everything*, with timestamps.
2. Spend your live attention on *understanding*, and your review time on the structured version.

## A workflow that respects both needs

- **During class:** record. Jot only questions and "aha" moments — things a transcript can't capture.
- **Right after:** skim the AI-generated notes while the lecture is fresh. Fix anything that reads wrong; the transcript is one click away for verification.
- **Two days later:** run the quiz. Missed questions tell you exactly which section to reread.
- **Before the exam:** the flashcards and the mind map become your final-pass tools.

The point of automation isn't to skip the work of learning — it's to move your effort to the part of the work that only a human can do.`,
  },
  {
    slug: "turn-youtube-into-a-course",
    title: "How to turn a YouTube playlist into a real course (with notes)",
    excerpt:
      "YouTube is the world's biggest free university with the world's worst retention rate. A simple system for actually remembering what you watch.",
    date: "2026-05-30",
    readMinutes: 5,
    emoji: "▶️",
    body: `## The problem with "educational" watching

You watch a brilliant 40-minute explainer, nod along, feel smarter — and a week later you can reconstruct almost none of it. Recognition felt like learning, but nothing was encoded.

## Treat videos like lectures, not entertainment

The difference between a student and a viewer is what happens *around* the watching:

1. **Import before you watch.** Paste the link into your note tool and let it produce the transcript and structured notes. Now you know the video's skeleton before pressing play.
2. **Watch for the hard parts.** Since the easy 80% is already in your notes, spend your attention on the 20% that confused you. Use the time-synced transcript to rewatch exactly those moments.
3. **Close the loop the same day.** Take the auto-generated quiz. Five minutes of retrieval practice roughly doubles what survives the week.
4. **Connect across videos.** After a few videos on a topic, scan your mind maps side by side. The overlaps are the core concepts; the differences are the interesting bits.

## Playlists become courses

A playlist processed this way produces exactly what a course would: a syllabus (your note list), lecture notes, review questions and a final-exam study sheet. The only thing missing is the tuition bill.`,
  },
  {
    slug: "meeting-notes-people-actually-read",
    title: "Meeting notes people actually read",
    excerpt:
      "Nobody reads a wall of minutes. What busy teams need from a meeting record — and how to produce it in two minutes instead of thirty.",
    date: "2026-05-12",
    readMinutes: 4,
    emoji: "📋",
    body: `## Minutes vs. memory

The purpose of meeting notes isn't to prove the meeting happened — it's to make the *next* meeting unnecessary. That requires three things, in this order:

1. **Decisions** — what did we agree, and who disagreed?
2. **Actions** — who does what, by when?
3. **Context** — just enough reasoning that someone absent can follow.

A verbatim record has all three… buried in forty paragraphs where no one will look.

## The two-minute workflow

- Record the meeting (with everyone's knowledge — always).
- Let the AI produce the transcript and a structured summary.
- Spend your two minutes on the part that needs judgment: check the decisions section against your memory, and confirm each action item has an owner.
- Share the note's read-only link in the channel. Anyone who wants the details can expand the transcript; nobody has to.

## The searchable archive is the real prize

Six weeks later, when someone asks "why did we choose the smaller vendor?", you don't schedule an archaeology meeting. You open the chat on the old note and ask. The answer comes back with the exact moment in the recording where it was decided.`,
  },
  {
    slug: "flashcards-that-dont-waste-your-time",
    title: "Flashcards that don't waste your time",
    excerpt:
      "Most self-made flashcards test recognition, not recall. What makes a card effective, and why generating them from your actual notes beats a shared deck.",
    date: "2026-04-22",
    readMinutes: 5,
    emoji: "🃏",
    body: `## Why most decks fail

Two failure modes account for almost all wasted flashcard time:

- **Cards that test recognition.** "Is mitochondria the powerhouse of the cell? (yes/no)" — you'll never fail it, so you'll never learn from it.
- **Cards you didn't make from material you didn't study.** Downloaded decks test someone else's course. The vocabulary is subtly off, the emphasis is wrong, and half the cards cover material your class skipped.

## What a good card looks like

- Asks **one thing**. If the answer has four parts, that's four cards.
- Requires **production**, not recognition: "What does the anchoring effect predict about first offers in a negotiation?" beats "Define anchoring."
- Includes **why**, not only what — cards that carry a one-line explanation on the back teach even when you get them right.

## Generate, then prune

Generating cards from your own notes fixes the coverage problem: the deck tests exactly what your source covered, in its vocabulary. Your job shifts from authoring to editing — delete the few cards that feel trivial, tweak wording where you'd phrase it differently, and regenerate for a fresh angle when the deck starts feeling memorized rather than understood.

Ten minutes a day with a deck built from your own lectures outperforms an hour with someone else's.`,
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
