import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { updateUser } from "@/lib/store";
import { catalog, planCanUseModel } from "@/lib/ai/models";

/** POST { modelId } — set the signed-in user's preferred AI model. */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const body = (await req.json().catch(() => null)) as {
    modelId?: string;
  } | null;
  const modelId = body?.modelId;
  if (!modelId) return jsonError("Missing modelId.");
  if (!catalog().some((m) => m.id === modelId)) {
    return jsonError("That model isn't available on this server.", 400);
  }
  // Enforce the plan: a free user can't select a Pro-only model.
  if (!planCanUseModel(auth.user.plan, modelId)) {
    return jsonError(
      "That model is available on the Pro plan. Upgrade to use it.",
      403,
      "requires_pro"
    );
  }
  const user = await updateUser(auth.user.id, (u) => {
    u.modelId = modelId;
  });
  return NextResponse.json({ modelId: user?.modelId ?? modelId });
}
