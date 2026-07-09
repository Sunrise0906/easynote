import crypto from "crypto";
import fs from "fs";
import fsp from "fs/promises";
import { hashPassword } from "./auth";
import { dataPath, Note, saveNote, saveUser, User } from "./store";
import { CardState } from "./srs";
import { dayKey } from "./utils";

/**
 * Seeds a demo account with one fully populated note so the whole app can
 * be explored without any API keys. Runs once (guarded by a flag file).
 */
export async function ensureDemoData(): Promise<void> {
  const flag = dataPath(".seeded");
  if (fs.existsSync(flag)) return;

  const user: User = {
    id: "u_demo",
    email: "demo@easynote.local",
    name: "Demo Student",
    passwordHash: await hashPassword("demo1234"),
    guest: false,
    plan: "free",
    usage: { notes: {}, chat: {} },
    createdAt: Date.now(),
  };
  await saveUser(user);

  const now = Date.now();
  const note: Note = {
    id: "n_demo_memory",
    userId: user.id,
    folderId: null,
    title: "The Science of Memory: How We Actually Learn",
    emoji: "🧠",
    sourceType: "text",
    status: "ready",
    progress: 100,
    language: "en",
    transcript: DEMO_TRANSCRIPT.map((text, i) => ({ start: i, text })),
    summary:
      "This lecture explains how memories are formed, why we forget, and which study techniques are actually supported by cognitive science. It covers the three stages of memory (encoding, storage, retrieval), the forgetting curve, and evidence-based methods: retrieval practice, spaced repetition, interleaving, and elaboration.",
    keyPoints: [
      "Memory has three stages — encoding, storage, and retrieval — and most 'memory failures' are really encoding failures.",
      "The forgetting curve shows that without review, most new information fades within days.",
      "Retrieval practice (testing yourself) strengthens memory far more than re-reading.",
      "Spaced repetition times reviews to just before you'd forget, flattening the forgetting curve.",
      "Interleaving related topics feels harder but produces more durable learning than blocked practice.",
      "Elaboration — explaining ideas in your own words and connecting them to what you know — deepens encoding.",
    ],
    notesMarkdown: DEMO_NOTES_MD,
    flashcards: [
      {
        front: "What are the three stages of memory?",
        back: "Encoding (getting information in), storage (maintaining it over time), and retrieval (getting it back out). A failure at any stage looks like 'forgetting'.",
      },
      {
        front: "Why does re-reading feel effective but work poorly?",
        back: "Re-reading creates fluency — the material feels familiar — but familiarity is not recall. It strengthens recognition, not the retrieval pathways you need during a test.",
      },
      {
        front: "What is retrieval practice?",
        back: "Actively pulling information from memory (self-testing, flashcards, closed-book summaries). The act of retrieving strengthens the memory trace more than re-exposure does.",
      },
      {
        front: "What does the forgetting curve describe?",
        back: "The rapid decay of new information over time without review — steepest in the first 24–48 hours after learning.",
      },
      {
        front: "How does spaced repetition counteract the forgetting curve?",
        back: "By scheduling reviews at increasing intervals, each review is timed near the point of forgetting, which re-consolidates the memory and slows future decay.",
      },
      {
        front: "What is interleaving, and why does it help?",
        back: "Mixing related topics or problem types within a study session. It forces you to discriminate between methods and repeatedly re-load each one, producing more durable, flexible learning than blocking.",
      },
      {
        front: "What is elaboration as a study strategy?",
        back: "Explaining material in your own words, asking 'why' and 'how', and connecting new ideas to things you already know — creating more retrieval routes to the memory.",
      },
      {
        front: "Why is sleep important for memory?",
        back: "Consolidation — the stabilization and reorganization of new memories — happens largely during sleep. Sacrificing sleep to cram removes the step where memories are actually saved.",
      },
    ],
    quiz: [
      {
        question:
          "A student re-reads a chapter five times and feels confident, but fails the exam. Which memory concept best explains this?",
        options: [
          "Fluency illusion — familiarity was mistaken for recall ability",
          "Storage decay — the memories disappeared overnight",
          "Interference from other subjects",
          "Insufficient encoding time",
        ],
        answerIndex: 0,
        explanation:
          "Re-reading builds recognition fluency: the text feels familiar, so the student feels prepared. But exams require retrieval, which re-reading barely trains.",
      },
      {
        question:
          "According to the forgetting curve, when is a first review most valuable?",
        options: [
          "Within a day or two, while the trace is still recoverable",
          "One month later, once the memory has settled",
          "Only right before the exam",
          "Timing doesn't matter, only total review time",
        ],
        answerIndex: 0,
        explanation:
          "Forgetting is steepest immediately after learning, so an early first review rescues the memory at its most fragile point; later reviews can then be spaced further apart.",
      },
      {
        question:
          "Which study plan uses interleaving?",
        options: [
          "Alternating between integration, derivatives and limits problems in one session",
          "Doing 50 integration problems, then 50 derivative problems next week",
          "Re-reading notes for each topic on separate days",
          "Watching lecture videos at 2x speed twice",
        ],
        answerIndex: 0,
        explanation:
          "Interleaving mixes problem types within a session, forcing you to choose the right method each time — that discrimination practice is what transfers to exams.",
      },
      {
        question: "Which activity is the purest form of retrieval practice?",
        options: [
          "Writing a closed-book summary of yesterday's lecture",
          "Highlighting the most important sentences",
          "Re-watching the lecture recording",
          "Copying your notes out neatly",
        ],
        answerIndex: 0,
        explanation:
          "A closed-book summary forces you to pull everything from memory with no cues — exactly the operation you'll need to perform later.",
      },
      {
        question:
          "Why does the lecture call sleep 'part of studying'?",
        options: [
          "Memory consolidation largely happens during sleep",
          "Sleep reduces test anxiety",
          "Dreams contain review sessions",
          "Being tired makes encoding faster",
        ],
        answerIndex: 0,
        explanation:
          "New memories are stabilized and integrated during sleep. An all-nighter skips consolidation, so much of what was crammed never gets durably stored.",
      },
    ],
    translations: {},
    chat: [],
    shareToken: null,
    createdAt: now - 1000 * 60 * 60 * 5,
    updatedAt: now - 1000 * 60 * 60 * 5,
  };
  await saveNote(note);
  await seedReviews(user.id, note, now);

  await fsp.writeFile(flag, new Date().toISOString(), "utf8");
}

/** Pre-populate the demo user's spaced-repetition pool so Review & Memory
 *  look alive: cards at varied schedules + two weeks of review history. */
async function seedReviews(
  userId: string,
  note: Note,
  now: number
): Promise<void> {
  const DAY = 86_400_000;
  const cardId = (front: string) =>
    crypto
      .createHash("sha1")
      .update(`${note.id}::${front.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 300)}`)
      .digest("base64url")
      .slice(0, 16);

  // profile cycle: mastered · forgetting-soon · fresh · new
  const profiles: {
    state: CardState;
    stability: number;
    difficulty: number;
    lastAgoD: number | null;
    dueInD: number;
    reps: number;
  }[] = [
    { state: "review", stability: 34, difficulty: 4.5, lastAgoD: 6, dueInD: 26, reps: 5 },
    { state: "review", stability: 2, difficulty: 7, lastAgoD: 12, dueInD: -2, reps: 3 },
    { state: "review", stability: 9, difficulty: 5.5, lastAgoD: 2, dueInD: 6, reps: 3 },
    { state: "new", stability: 0, difficulty: 0, lastAgoD: null, dueInD: 0, reps: 0 },
    { state: "review", stability: 1.6, difficulty: 8, lastAgoD: 9, dueInD: -1, reps: 2 },
  ];

  const cards = (note.flashcards ?? []).map((fc, i) => {
    const p = profiles[i % profiles.length];
    return {
      id: cardId(fc.front),
      noteId: note.id,
      noteTitle: note.title,
      front: fc.front,
      back: fc.back,
      srs: {
        stability: p.stability,
        difficulty: p.difficulty,
        due: now + p.dueInD * DAY,
        lastReview: p.lastAgoD === null ? null : now - p.lastAgoD * DAY,
        reps: p.reps,
        lapses: p.state === "review" && p.stability < 3 ? 1 : 0,
        state: p.state,
      },
      createdAt: now - 14 * DAY,
    };
  });

  // ~2 weeks of activity (most days, varied counts) for the streak + chart
  const history: { ts: number; cardId: string; grade: 1 | 2 | 3 | 4; day: string }[] = [];
  const counts = [3, 5, 0, 4, 6, 2, 5, 0, 7, 3, 4, 5, 6, 4];
  const anyCard = cards[0]?.id ?? "seed";
  counts.forEach((c, idx) => {
    const dayAgo = counts.length - 1 - idx;
    const ts = now - dayAgo * DAY;
    for (let k = 0; k < c; k++) {
      history.push({
        ts,
        cardId: anyCard,
        grade: (2 + (k % 3)) as 2 | 3 | 4,
        day: dayKey(ts),
      });
    }
  });

  const store = {
    cards,
    history,
    lastReviewDay: dayKey(now - DAY),
    streak: 6,
  };
  const dir = dataPath("reviews");
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(
    dataPath("reviews", `${userId}.json`),
    JSON.stringify(store, null, 2),
    "utf8"
  );
}

const DEMO_TRANSCRIPT = [
  "Welcome back. Today we're tackling a question every student should care about: how does memory actually work, and why do most popular study habits fight against it rather than with it?",
  "Psychologists describe memory in three stages. Encoding is getting information into your head. Storage is keeping it there over time. And retrieval is getting it back out when you need it. Here's the first insight: most of what we call forgetting is really an encoding failure — the information never got in properly in the first place.",
  "Think about reading a page while checking your phone. Your eyes touched every word, but attention is the gatekeeper of encoding. Divided attention means shallow encoding, and shallow encoding means there's nothing there to retrieve on Friday's quiz.",
  "Now, even well-encoded memories fade. In the 1880s, Hermann Ebbinghaus memorized nonsense syllables and tested himself at intervals. The result is the famous forgetting curve: retention drops steeply within the first day or two, then levels off. Without review, most new material is gone within a week.",
  "So what works? Let's start with the technique with the strongest evidence: retrieval practice. Every time you pull a memory out — answering a question, writing a summary with the book closed — you strengthen it. Testing is not just measurement; testing is the intervention.",
  "Compare that to re-reading, the most popular strategy in every survey we run. Re-reading creates fluency. The words feel familiar, so you feel prepared. But recognition and recall are different systems. The exam doesn't ask whether the page looks familiar — it asks you to produce the answer from nothing.",
  "The second technique is spacing. One three-hour session and three one-hour sessions contain the same work, but the spaced version can double long-term retention. The trick is that each review should come just as you're starting to forget — that difficulty is what re-consolidates the trace. This is exactly what spaced repetition software automates.",
  "Third, interleaving. Instead of doing twenty problems of one type — blocked practice — mix the types. It feels worse. Your error rate during practice goes up. But you're practicing the skill exams actually require: recognizing which kind of problem you're facing and selecting the right tool.",
  "Fourth, elaboration. Ask 'why does this make sense?' and 'how does this connect to what I already know?'. Explaining a concept in your own words — to a classmate, or to an imaginary twelve-year-old — exposes gaps instantly and builds multiple retrieval routes to the same idea.",
  "A quick word about cramming. An all-nighter can work for tomorrow morning's quiz — and be gone by the weekend. Consolidation, the process that stabilizes new memories, happens substantially during sleep. Trading sleep for study time removes the save step. If you remember one thing: sleep is part of studying, not a break from it.",
  "Let's put it together as a weekly system. Within a day of each lecture, do a ten-minute closed-book brain dump, then check your notes for what you missed. Turn those gaps into flashcards. Review the deck on a spacing schedule — a few minutes daily beats an hour weekly. And before the exam, do one full practice test under real conditions.",
  "Next week we'll look at how these principles apply to skill learning — sports, music, and programming — where the story gets even more interesting. See you then.",
];

const DEMO_NOTES_MD = `## Overview

This lecture explains the three-stage model of memory and uses it to evaluate common study habits. The central argument: most popular techniques (re-reading, highlighting, cramming) optimize for *feeling* prepared, while techniques with real evidence (retrieval practice, spacing, interleaving, elaboration) optimize for durable recall.

## The three stages of memory

- **Encoding** — getting information in. Requires attention; divided attention → shallow encoding.
- **Storage** — maintaining information over time. Strengthened by consolidation, which happens largely **during sleep**.
- **Retrieval** — getting information back out. The stage exams actually test.
- Key insight: much of "forgetting" is an **encoding failure** — the material never got in.

## The forgetting curve

- Discovered by **Hermann Ebbinghaus** (1880s) using self-tests on nonsense syllables.
- Retention drops **steeply within 24–48 hours**, then levels off.
- Without review, most new material is effectively gone within a week.
- Implication: the *timing* of review matters as much as the amount.

## What actually works

### 1. Retrieval practice
- Actively pulling information from memory: self-quizzing, flashcards, **closed-book summaries**.
- "Testing is not just measurement — testing is the intervention."
- Far stronger effect than re-exposure (re-reading, re-watching).

### 2. Spaced repetition
- Distribute the same study time across multiple sessions.
- Each review lands **just as forgetting begins** — the difficulty re-consolidates the memory.
- Spaced-repetition software automates the scheduling.

### 3. Interleaving
- Mix related problem types in one session instead of blocking them.
- Feels harder and raises practice error rates — but trains **method selection**, which is what exams require.

### 4. Elaboration
- Ask *why* and *how*; connect new ideas to existing knowledge.
- Explaining in your own words exposes gaps and builds extra retrieval routes.

## Why re-reading and cramming fail

- Re-reading creates **fluency**: familiarity that masquerades as knowledge.
- Recognition ≠ recall — exams demand production, not familiarity.
- Cramming can survive until tomorrow's quiz but skips **sleep-dependent consolidation**, so little is stored durably.

## A practical weekly system

1. Within 24h of each lecture: 10-minute **closed-book brain dump**, then check notes for gaps.
2. Convert gaps into **flashcards**.
3. Review the deck on a **spacing schedule** (minutes daily > an hour weekly).
4. Before the exam: one full **practice test** under realistic conditions.

## Key Takeaways

- Attention is the gatekeeper of encoding — no attention, no memory.
- Review early (within 1–2 days), then space subsequent reviews.
- Prefer testing yourself over re-reading, every time.
- Interleave related topics even though it feels less productive.
- Sleep is part of studying: it's when memories are saved.`;
