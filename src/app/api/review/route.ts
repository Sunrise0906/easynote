import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { dueQueue, memoryStats, syncFromNotes } from "@/lib/reviews";

/** GET — sync the pool from notes and return today's due queue + counts. */
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const store = await syncFromNotes(auth.user.id);
  const now = Date.now();
  const queue = dueQueue(store, now);
  const stats = memoryStats(store, now);
  return NextResponse.json({
    queue,
    counts: {
      due: stats.dueNow,
      dueToday: stats.dueToday,
      total: stats.totalCards,
      new: stats.newCards,
    },
    streak: stats.streak,
  });
}
