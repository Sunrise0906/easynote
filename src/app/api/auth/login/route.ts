import { NextRequest, NextResponse } from "next/server";
import { startSession, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/store";
import { jsonError } from "@/lib/api";
import { ensureDemoData } from "@/lib/seed";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`login:ip:${ip}`, 20, 10 * 60 * 1000)) {
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
  const email = body.email.trim().toLowerCase();

  // Per-email throttle bounds brute force even if the client IP is spoofed.
  if (!rateLimit(`login:email:${email}`, 10, 10 * 60 * 1000)) {
    return jsonError("Too many attempts for this account. Try again later.", 429);
  }

  const user = await getUserByEmail(email);
  // verifyPassword runs a full scrypt even when the user is absent, so the
  // response time doesn't reveal whether the account exists.
  const ok = await verifyPassword(body.password, user?.passwordHash);
  if (!user || !ok) {
    return jsonError("Incorrect email or password.", 401);
  }
  await startSession(user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
  });
}
