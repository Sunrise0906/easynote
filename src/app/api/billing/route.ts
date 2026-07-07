import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { updateUser } from "@/lib/store";
import { PLANS, PRICING } from "@/lib/config";
import { quotaInfo } from "@/lib/quota";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  return NextResponse.json({
    plan: auth.user.plan,
    planInterval: auth.user.planInterval ?? null,
    planSince: auth.user.planSince ?? null,
    quota: quotaInfo(auth.user),
    plans: PLANS,
    pricing: PRICING,
  });
}

/**
 * POST { action: "upgrade", interval: "monthly" | "yearly" } |
 *      { action: "cancel" }
 *
 * This is a local demo checkout — no real payment is processed.
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const body = (await req.json().catch(() => null)) as {
    action?: string;
    interval?: "monthly" | "yearly";
  } | null;

  if (body?.action === "upgrade") {
    const interval = body.interval === "yearly" ? "yearly" : "monthly";
    const user = await updateUser(auth.user.id, (u) => {
      u.plan = "pro";
      u.planInterval = interval;
      u.planSince = Date.now();
    });
    return NextResponse.json({ ok: true, plan: user?.plan, interval });
  }
  if (body?.action === "cancel") {
    const user = await updateUser(auth.user.id, (u) => {
      u.plan = "free";
      u.planInterval = undefined;
      u.planSince = undefined;
    });
    return NextResponse.json({ ok: true, plan: user?.plan });
  }
  return jsonError("Unknown action.");
}
