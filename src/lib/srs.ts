/**
 * FSRS-5 spaced-repetition scheduler (the algorithm Anki now ships by
 * default). Pure functions — no I/O. Powers Recall's "remember what you
 * learn" loop: every card carries a memory model (stability + difficulty),
 * and each review reschedules it for the moment you're about to forget.
 *
 * Grades: 1 Again · 2 Hard · 3 Good · 4 Easy
 */

export type Grade = 1 | 2 | 3 | 4;
export type CardState = "new" | "learning" | "review" | "relearning";

export interface SrsState {
  stability: number; // days; memory "half-life"
  difficulty: number; // 1..10
  due: number; // epoch ms
  lastReview: number | null; // epoch ms
  reps: number;
  lapses: number;
  state: CardState;
}

/** FSRS-5 default parameters. */
const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575,
  0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655,
  0.6621,
];

const DECAY = -0.5;
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1; // = 19/81 ≈ 0.2346
const REQUEST_RETENTION = 0.9; // target recall probability
const MIN_STABILITY = 0.01;
const DAY = 86_400_000;

export function emptyState(now = Date.now()): SrsState {
  return {
    stability: 0,
    difficulty: 0,
    due: now,
    lastReview: null,
    reps: 0,
    lapses: 0,
    state: "new",
  };
}

const clampD = (d: number) => Math.min(10, Math.max(1, d));

function initDifficulty(grade: Grade): number {
  return clampD(W[4] - Math.exp(W[5] * (grade - 1)) + 1);
}

function initStability(grade: Grade): number {
  return Math.max(MIN_STABILITY, W[grade - 1]);
}

function nextDifficulty(d: number, grade: Grade): number {
  const delta = d - W[6] * (grade - 3);
  // mean-reversion toward the "Good"-initialised difficulty
  const reverted = W[7] * initDifficulty(4) + (1 - W[7]) * delta;
  return clampD(reverted);
}

function nextStabilitySuccess(
  d: number,
  s: number,
  r: number,
  grade: Grade
): number {
  const hard = grade === 2 ? W[15] : 1;
  const easy = grade === 4 ? W[16] : 1;
  const inc =
    Math.exp(W[8]) *
    (11 - d) *
    Math.pow(s, -W[9]) *
    (Math.exp(W[10] * (1 - r)) - 1) *
    hard *
    easy;
  return Math.max(MIN_STABILITY, s * (1 + inc));
}

function nextStabilityLapse(d: number, s: number, r: number): number {
  const post =
    W[11] *
    Math.pow(d, -W[12]) *
    (Math.pow(s + 1, W[13]) - 1) *
    Math.exp(W[14] * (1 - r));
  return Math.max(MIN_STABILITY, Math.min(post, s));
}

/** Probability the card is recallable right now (0..1). */
export function retrievability(state: SrsState, now = Date.now()): number {
  if (state.state === "new" || !state.lastReview || state.stability <= 0) {
    return 0;
  }
  const elapsedDays = Math.max(0, (now - state.lastReview) / DAY);
  return Math.pow(1 + (FACTOR * elapsedDays) / state.stability, DECAY);
}

/** Interval (days) that lands the card at the target retention. */
function intervalDays(stability: number): number {
  const days =
    (stability / FACTOR) *
    (Math.pow(REQUEST_RETENTION, 1 / DECAY) - 1);
  return Math.max(1, Math.round(days));
}

/**
 * Apply a review grade and return the next scheduling state.
 * "Again" re-shows the card in the same session (due immediately); the other
 * grades schedule it days ahead.
 */
export function schedule(
  prev: SrsState,
  grade: Grade,
  now = Date.now()
): SrsState {
  // First-ever review of a new card.
  if (prev.state === "new" || !prev.lastReview) {
    const stability = initStability(grade);
    const difficulty = initDifficulty(grade);
    if (grade === 1) {
      return {
        stability,
        difficulty,
        due: now + 60_000, // re-show in ~1 min (this session)
        lastReview: now,
        reps: 1,
        lapses: 1,
        state: "learning",
      };
    }
    const days = grade === 2 ? 1 : intervalDays(stability);
    return {
      stability,
      difficulty,
      due: now + days * DAY,
      lastReview: now,
      reps: 1,
      lapses: 0,
      state: "review",
    };
  }

  const r = retrievability(prev, now);
  const difficulty = nextDifficulty(prev.difficulty, grade);

  if (grade === 1) {
    const stability = nextStabilityLapse(prev.difficulty, prev.stability, r);
    return {
      stability,
      difficulty,
      due: now + 600_000, // re-show in ~10 min
      lastReview: now,
      reps: prev.reps + 1,
      lapses: prev.lapses + 1,
      state: "relearning",
    };
  }

  const stability = nextStabilitySuccess(
    prev.difficulty,
    prev.stability,
    r,
    grade
  );
  return {
    stability,
    difficulty,
    due: now + intervalDays(stability) * DAY,
    lastReview: now,
    reps: prev.reps + 1,
    lapses: prev.lapses,
    state: "review",
  };
}

export const GRADE_LABELS: Record<Grade, string> = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

/** Preview of the next interval per grade (for the review buttons). */
export function previewIntervals(
  prev: SrsState,
  now = Date.now()
): Record<Grade, string> {
  const fmt = (state: SrsState): string => {
    const ms = state.due - now;
    if (ms < 3600_000) return `${Math.max(1, Math.round(ms / 60_000))}m`;
    if (ms < DAY) return `${Math.round(ms / 3600_000)}h`;
    const d = Math.round(ms / DAY);
    if (d < 30) return `${d}d`;
    if (d < 365) return `${Math.round(d / 30)}mo`;
    return `${(d / 365).toFixed(1)}y`;
  };
  return {
    1: fmt(schedule(prev, 1, now)),
    2: fmt(schedule(prev, 2, now)),
    3: fmt(schedule(prev, 3, now)),
    4: fmt(schedule(prev, 4, now)),
  };
}
