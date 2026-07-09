import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { gradeCard } from "@/lib/reviews";
import { Grade } from "@/lib/srs";

/** POST { cardId, grade: 1|2|3|4 } — record a review and reschedule the card. */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const body = (await req.json().catch(() => null)) as {
    cardId?: string;
    grade?: number;
  } | null;
  const cardId = body?.cardId;
  const grade = body?.grade;
  if (!cardId || ![1, 2, 3, 4].includes(grade ?? 0)) {
    return jsonError("cardId and grade (1-4) are required.");
  }
  const res = await gradeCard(auth.user.id, cardId, grade as Grade);
  if (!res.ok) return jsonError("Card not found.", 404);
  return NextResponse.json({ ok: true, next: res.next });
}
