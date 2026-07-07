import { NextRequest, NextResponse } from "next/server";
import { createGuestUser, startSession } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  if (!rateLimit(`guest:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    return jsonError("Too many guest sessions from this address. Try again later.", 429);
  }
  const user = await createGuestUser();
  await startSession(user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
  });
}
