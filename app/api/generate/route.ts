import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { getAssignment } from "@/lib/server/assignments";
import { startGeneration } from "@/lib/server/generation";
import { ensureRedis } from "@/lib/db/redis";
import { registerGenerationWorker } from "@/lib/queue/worker";
import { createAssignmentSchema } from "@/lib/validation";
import { z } from "zod";

const generateSchema = createAssignmentSchema.extend({
  assignmentId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid generation payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { assignmentId, ...input } = parsed.data;
    const owned = await getAssignment(assignmentId, session.userId);
    if (!owned) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    await ensureRedis();
    registerGenerationWorker();

    const result = await startGeneration(assignmentId, input);

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    console.error("[api/generate] POST failed:", error);
    return NextResponse.json(
      {
        error: "Failed to start generation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
