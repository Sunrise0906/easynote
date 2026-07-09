import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { memoryStats, syncFromNotes } from "@/lib/reviews";

/** GET — the memory dashboard: retention, mastery per note, forgetting risk. */
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const store = await syncFromNotes(auth.user.id);
  return NextResponse.json({ stats: memoryStats(store) });
}
