import { NextRequest, NextResponse } from "next/server";
import { registerUser, startSession } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  if (!rateLimit(`register:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    return jsonError("Too many sign-ups from this address. Try again later.", 429);
  }
  const body = (await req.json().catch(() => null)) as {
    email?: string;
    password?: string;
    name?: string;
  } | null;
  if (!body?.email || !body?.password) {
    return jsonError("Email and password are required.");
  }
  const { user, error } = await registerUser(
    body.email,
    body.password,
    body.name
  );
  if (error || !user) return jsonError(error ?? "Could not create account.");
  await startSession(user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
  });
}
