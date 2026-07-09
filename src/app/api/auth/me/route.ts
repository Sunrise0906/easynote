import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { quotaInfo } from "@/lib/quota";
import { aiConfigured, sttConfigured, visionConfigured } from "@/lib/config";
import { publicModels, resolveModelForUser } from "@/lib/ai/models";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ user: null });
  const models = publicModels(user.plan);
  const activeModel = resolveModelForUser(user)?.id ?? null;
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      planInterval: user.planInterval,
      guest: user.guest,
      createdAt: user.createdAt,
      modelId: activeModel,
    },
    quota: quotaInfo(user),
    capabilities: {
      ai: aiConfigured(),
      stt: sttConfigured(),
      vision: visionConfigured(),
      models,
      activeModel,
    },
  });
}
