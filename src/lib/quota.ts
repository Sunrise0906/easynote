import { PLANS } from "./config";
import { consumeQuota, refundQuota, updateUser, User } from "./store";
import { dayKey, monthKey } from "./utils";

export interface QuotaInfo {
  plan: string;
  notesUsed: number;
  notesLimit: number;
  chatUsed: number;
  chatLimit: number;
  maxUploadMB: number;
}

export function quotaInfo(user: User): QuotaInfo {
  const plan = PLANS[user.plan];
  return {
    plan: user.plan,
    notesUsed: user.usage.notes[monthKey()] ?? 0,
    notesLimit: plan.notesPerMonth,
    chatUsed: user.usage.chat[dayKey()] ?? 0,
    chatLimit: plan.chatPerDay,
    maxUploadMB: plan.maxUploadMB,
  };
}

/**
 * Atomically reserve one note against this month's quota. Returns true if the
 * note may be created (and the counter was incremented), false if the limit
 * is reached. Prefer this over the check-then-`recordNoteCreated` pattern —
 * it closes the concurrent-request race.
 */
export async function reserveNote(user: User): Promise<boolean> {
  return consumeQuota(
    user.id,
    "notes",
    monthKey(),
    PLANS[user.plan].notesPerMonth
  );
}

export async function releaseNote(userId: string): Promise<void> {
  await refundQuota(userId, "notes", monthKey());
}

/** Atomically reserve one chat message against today's quota. */
export async function reserveChat(user: User): Promise<boolean> {
  return consumeQuota(user.id, "chat", dayKey(), PLANS[user.plan].chatPerDay);
}

export async function releaseChat(userId: string): Promise<void> {
  await refundQuota(userId, "chat", dayKey());
}

export function canCreateNote(user: User): boolean {
  const q = quotaInfo(user);
  return q.notesUsed < q.notesLimit;
}

export function canChat(user: User): boolean {
  const q = quotaInfo(user);
  return q.chatUsed < q.chatLimit;
}

/* Legacy non-atomic recorders, kept for callers that already reserved. */
export async function recordNoteCreated(userId: string): Promise<void> {
  await updateUser(userId, (u) => {
    const k = monthKey();
    u.usage.notes[k] = (u.usage.notes[k] ?? 0) + 1;
  });
}

export async function recordChatMessage(userId: string): Promise<void> {
  await updateUser(userId, (u) => {
    const k = dayKey();
    u.usage.chat[k] = (u.usage.chat[k] ?? 0) + 1;
  });
}
