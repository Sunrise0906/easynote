import { NextResponse } from "next/server";
import fs from "fs";
import { aiConfigured, config, sttConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe for containers and uptime monitors. */
export async function GET() {
  let dataWritable = false;
  try {
    fs.mkdirSync(config.dataDir, { recursive: true });
    fs.accessSync(config.dataDir, fs.constants.W_OK);
    dataWritable = true;
  } catch {
    /* reported below */
  }
  const ok = dataWritable;
  return NextResponse.json(
    {
      ok,
      dataWritable,
      ai: aiConfigured(),
      stt: sttConfigured(),
      uptimeSec: Math.floor(process.uptime()),
    },
    { status: ok ? 200 : 503 }
  );
}
