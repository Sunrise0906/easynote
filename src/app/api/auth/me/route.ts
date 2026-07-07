import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { quotaInfo } from "@/lib/quota";
import {
  aiConfigured,
  config,
  sttConfigured,
  visionConfigured,
} from "@/lib/config";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      planInterval: user.planInterval,
      guest: user.guest,
      createdAt: user.createdAt,
    },
    quota: quotaInfo(user),
    capabilities: {
      ai: aiConfigured(),
      stt: sttConfigured(),
      vision: visionConfigured(),
      provider: config.ai.provider,
      model:
        config.ai.provider === "openai"
          ? config.ai.openai.model
          : config.anthropic.model,
    },
  });
}
