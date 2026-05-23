import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { getJobStatus } from "@/lib/db/redis";
import { getAssignment } from "@/lib/server/assignments";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cached = await getJobStatus(id);
    const assignment = await getAssignment(id, session.userId);

    if (!assignment) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const cachedStatus =
      typeof cached?.status === "string" ? cached.status : undefined;
    const cachedProgress =
      typeof cached?.progress === "number" ? cached.progress : undefined;
    const cachedMessage =
      typeof cached?.message === "string" ? cached.message : undefined;

    const assignmentHasPaper = Boolean(assignment.generatedPaper);
    const isCompleted = assignment.status === "completed" || assignmentHasPaper;
    const isFailed = assignment.status === "failed";

    const status = isCompleted
      ? "completed"
      : isFailed
        ? "failed"
        : cachedStatus || assignment.status;

    const progress =
      status === "completed"
        ? 100
        : status === "failed"
          ? 0
          : cachedProgress ?? 0;

    const message =
      status === "completed"
        ? "Question paper ready"
        : status === "failed"
          ? cachedMessage || "Generation failed"
          : cachedMessage || "Processing";

    return NextResponse.json({
      assignmentId: id,
      status,
      progress,
      message,
      assignment,
    });
  } catch (error) {
    console.error("[api/jobs/id] GET failed:", error);
    return NextResponse.json({ error: "Failed to load job status" }, { status: 500 });
  }
}
