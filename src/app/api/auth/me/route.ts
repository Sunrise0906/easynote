import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { quotaInfo } from "@/lib/quota";
import { aiConfigured, sttConfigured } from "@/lib/config";

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
    capabilities: { ai: aiConfigured(), stt: sttConfigured() },
  });
}
