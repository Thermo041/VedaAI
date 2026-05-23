import { Worker } from "bullmq";
import type { Server as SocketServer } from "socket.io";
import { ensureRedis, getRedis, setJobStatus } from "@/lib/db/redis";
import { connectMongo } from "@/lib/db/mongodb";
import { getAssignment, updateAssignment } from "@/lib/server/assignments";
import { generatePaper } from "@/lib/ai/gemini";
import { emitGenerationUpdate } from "@/lib/socket";
import { generationAssignmentSchema } from "@/lib/validation";

const QUEUE_NAME = "vedaai-generation";

let worker: Worker | null = null;

async function updateProgress(
  assignmentId: string,
  status: string,
  progress: number,
  message: string
) {
  const payload = { status, progress, message };
  await setJobStatus(assignmentId, payload);
  emitGenerationUpdate(assignmentId, payload);
}

async function processAssignment(assignmentId: string) {
  const record = await getAssignment(assignmentId);
  if (!record) {
    throw new Error("Assignment not found");
  }

  const input = generationAssignmentSchema.parse({
    title: record.title,
    subject: record.subject,
    classLevel: record.classLevel,
    timeAllowed: record.timeAllowed,
    dueDate: record.dueDate,
    questionTypes: record.questionTypes,
    additionalInfo: record.additionalInfo,
    fileName: record.fileUrl,
  });
  const computedTotalMarks = input.questionTypes.reduce(
    (sum, item) => sum + item.count * item.marks,
    0
  );

  const provider = process.env.AI_PROVIDER || "groq";
  await updateProgress(assignmentId, "processing", 45, `Generating with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`);
  const { paper, answerKey } = await generatePaper(input as import("@/lib/validation").CreateAssignmentInput);
  if (computedTotalMarks > 0) {
    paper.metadata.maxMarks = computedTotalMarks;
  }

  await updateProgress(assignmentId, "processing", 85, "Saving to MongoDB");

  await updateAssignment(assignmentId, {
    status: "completed",
    generatedPaper: paper,
    answerKey,
    totalMarks: computedTotalMarks > 0 ? computedTotalMarks : paper.metadata.maxMarks,
  });

  await updateProgress(assignmentId, "completed", 100, "Question paper ready");
  return { paper, answerKey };
}

export function registerGenerationWorker(io?: SocketServer) {
  if (worker) return worker;

  if (io) {
    io.on("connection", (socket) => {
      socket.on("assignment:subscribe", (assignmentId: string) => {
        if (typeof assignmentId === "string" && assignmentId.length > 0) {
          socket.join(`assignment:${assignmentId}`);
        }
      });
    });
  }

  const connection = getRedis();

  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const assignmentId = job.data.assignmentId as string;
      await connectMongo();
      await updateProgress(assignmentId, "processing", 15, "Building AI prompt");
      await updateAssignment(assignmentId, { status: "generating" });
      return processAssignment(assignmentId);
    },
    { connection }
  );

  worker.on("failed", async (job, error) => {
    const assignmentId = job?.data?.assignmentId as string | undefined;
    if (!assignmentId) return;

    await connectMongo();
    await updateAssignment(assignmentId, {
      status: "failed",
      errorMessage: error.message,
    });
    await updateProgress(
      assignmentId,
      "failed",
      0,
      error.message || "Generation failed"
    );
  });

  console.log("[worker] BullMQ generation worker started");
  return worker;
}

export async function bootstrapWorker(io?: SocketServer) {
  await ensureRedis();
  registerGenerationWorker(io);
}
