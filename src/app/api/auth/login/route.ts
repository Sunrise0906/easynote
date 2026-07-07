import { NextRequest, NextResponse } from "next/server";
import { startSession, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/store";
import { jsonError } from "@/lib/api";
import { ensureDemoData } from "@/lib/seed";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  if (!rateLimit(`login:${clientIp(req)}`, 20, 10 * 60 * 1000)) {
    return jsonError("Too many attempts. Try again in a few minutes.", 429);
  }
  await ensureDemoData();
  const body = (await req.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  if (!body?.email || !body?.password) {
    return jsonError("Email and password are required.");
  }
  const user = await getUserByEmail(body.email);
  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    return jsonError("Incorrect email or password.", 401);
  }
  await startSession(user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
  });
}
