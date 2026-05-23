import { Queue } from "bullmq";
import { ensureRedis, getRedis } from "@/lib/db/redis";

const QUEUE_NAME = "vedaai-generation";

let queue: Queue | null = null;

export async function getGenerationQueue() {
  await ensureRedis();
  const connection = getRedis();

  if (!queue) {
    queue = new Queue(QUEUE_NAME, { connection });
  }

  return queue;
}

export async function enqueueGeneration(assignmentId: string) {
  const generationQueue = await getGenerationQueue();
  const job = await generationQueue.add(
    "generate-paper",
    { assignmentId },
    {
      jobId: `${assignmentId}-${Date.now()}`,
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );
  return job.id;
}
