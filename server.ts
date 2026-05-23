import { createServer } from "http";
import next from "next";
import { Server as SocketServer } from "socket.io";
import { setSocketServer } from "@/lib/socket";
import { bootstrapWorker } from "@/lib/queue/worker";
import { connectMongo } from "@/lib/db/mongodb";
import { ensureRedis } from "@/lib/db/redis";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    console.error("[vedaai] JWT_SECRET is missing in .env.local");
    process.exit(1);
  }

  await app.prepare();

  try {
    await connectMongo();
    console.log("[vedaai] MongoDB connected");
  } catch (error) {
    console.error("[vedaai] MongoDB connection failed:", error);
    process.exit(1);
  }

  try {
    await ensureRedis();
    console.log("[vedaai] Redis connected");
  } catch (error) {
    console.error("[vedaai] Redis connection failed:", error);
    console.error(
      "[vedaai] Copy a fresh REDIS_URL from Upstash dashboard into .env.local"
    );
    process.exit(1);
  }

  const httpServer = createServer((req, res) => handle(req, res));

  const io = new SocketServer(httpServer, {
    path: "/api/socket/io",
    cors: { origin: "*" },
  });

  setSocketServer(io);
  await bootstrapWorker(io);

  httpServer.listen(port, () => {
    console.log(`VedaAI ready at http://${hostname}:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("[vedaai] Server failed to start:", error);
  process.exit(1);
});
