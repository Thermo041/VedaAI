import Redis from "ioredis";

let redis: Redis | null = null;

function createClient() {
  const url = process.env.REDIS_URL;
  if (!url) {
    const error = new Error(
      "REDIS_URL is required in .env.local. Please add your Upstash Redis URL."
    );
    console.error("[Redis] Missing REDIS_URL environment variable");
    throw error;
  }

  console.log("[Redis] Creating new Redis client...");
  
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error("[Redis] Max retries reached, giving up");
        return null;
      }
      const delay = Math.min(times * 200, 2000);
      console.log(`[Redis] Retry attempt ${times}, waiting ${delay}ms...`);
      return delay;
    },
  });
}

export async function ensureRedis() {
  if (!redis) {
    redis = createClient();
  }
  
  if (redis.status !== "ready") {
    try {
      console.log("[Redis] Connecting to Upstash Redis...");
      await redis.connect();
      console.log("[Redis] ✅ Successfully connected to Redis");
    } catch (error) {
      console.error(
        "\n" +
        "═══════════════════════════════════════════════════════════════\n" +
        "  🚨 REDIS CONNECTION ERROR\n" +
        "═══════════════════════════════════════════════════════════════\n" +
        "\n" +
        "Failed to connect to Upstash Redis.\n" +
        "\n" +
        "TO FIX THIS:\n" +
        "1. Go to: https://console.upstash.com/\n" +
        "2. Select your Redis database\n" +
        "3. Copy the 'REDIS_URL' (should start with 'rediss://')\n" +
        "4. Update REDIS_URL in your .env.local file\n" +
        "5. Make sure the URL includes the password\n" +
        "6. Restart your server\n" +
        "\n" +
        `Error: ${error instanceof Error ? error.message : String(error)}\n` +
        "\n" +
        "═══════════════════════════════════════════════════════════════\n"
      );
      redis = null;
      throw error;
    }
  }
  
  try {
    await redis.ping();
  } catch (error) {
    console.error("[Redis] Ping failed:", error);
    redis = null;
    throw error;
  }
  
  return redis;
}

export function getRedis() {
  if (!redis) {
    throw new Error("Redis not initialized. Call ensureRedis() first.");
  }
  return redis;
}

export async function setJobStatus(
  assignmentId: string,
  payload: Record<string, unknown>
) {
  const client = await ensureRedis();
  await client.set(
    `job:${assignmentId}`,
    JSON.stringify(payload),
    "EX",
    60 * 60 * 24
  );
}

export async function getJobStatus(assignmentId: string) {
  const client = await ensureRedis();
  const raw = await client.get(`job:${assignmentId}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
