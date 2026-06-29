import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { ensureRedis } from "@/lib/db/redis";

export async function GET() {
  let mongo = false;
  let redis = false;

  try {
    await connectMongo();
    mongo = true;
  } catch {
    mongo = false;
  }

  try {
    await ensureRedis();
    redis = true;
  } catch {
    redis = false;
  }

  return NextResponse.json({
    ok: mongo && redis,
    service: "VedamAI-assessment-creator",
    integrations: {
      mongo,
      redis,
      gemini: Boolean(process.env.GEMINI_API_KEY),
      jwt: Boolean(process.env.JWT_SECRET),
    },
  });
}
