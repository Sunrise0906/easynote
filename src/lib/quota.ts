import { PLANS } from "./config";
import { updateUser, User } from "./store";
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

export function canCreateNote(user: User): boolean {
  const q = quotaInfo(user);
  return q.notesUsed < q.notesLimit;
}

export function canChat(user: User): boolean {
  const q = quotaInfo(user);
  return q.chatUsed < q.chatLimit;
}

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
