import { enqueueGeneration } from "@/lib/queue/generationQueue";
import { setJobStatus } from "@/lib/db/redis";
import { CreateAssignmentInput } from "@/lib/validation";
import { connectMongo } from "@/lib/db/mongodb";
import { AssignmentModel } from "@/models/Assignment";

export async function startGeneration(
  assignmentId: string,
  input: CreateAssignmentInput
) {
  await connectMongo();
  await AssignmentModel.findOneAndUpdate(
    { _id: assignmentId },
    { $set: { status: "generating" }, $unset: { generatedPaper: "", answerKey: "" } }
  );

  await setJobStatus(assignmentId, {
    status: "queued",
    progress: 5,
    message: "Queued for generation",
  });

  const jobId = await enqueueGeneration(assignmentId);

  return {
    assignmentId,
    jobId,
    status: "queued" as const,
    progress: 5,
    message: "Generation queued",
    promptPreview: input.additionalInfo || input.title,
  };
}
