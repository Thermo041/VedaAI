import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalCache = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache =
  globalCache.mongooseCache ??
  (globalCache.mongooseCache = {
    conn: null,
    promise: null,
  });

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const error = new Error(
      "MONGODB_URI is required in .env.local. Please add your MongoDB connection string."
    );
    console.error("[MongoDB] Missing MONGODB_URI environment variable");
    throw error;
  }

  // Return existing connection if already connected
  if (cache.conn?.connection.readyState === 1) {
    console.log("[MongoDB] Using existing connection");
    return cache.conn;
  }

  // Clear failed promise to allow retry
  if (cache.conn?.connection.readyState === 0 || cache.conn?.connection.readyState === 3) {
    console.log("[MongoDB] Clearing failed connection, will retry...");
    cache.promise = null;
    cache.conn = null;
  }

  if (!cache.promise) {
    console.log("[MongoDB] Attempting to connect to MongoDB Atlas...");
    console.log("[MongoDB] Database:", process.env.MONGODB_DB_NAME || "vedaai");
    
    cache.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || "vedaai",
      serverSelectionTimeoutMS: 30000, // Increased to 30s
      socketTimeoutMS: 45000, // Increased to 45s
      connectTimeoutMS: 30000,
      family: 4,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
    }).catch((error) => {
      console.error("[MongoDB] Connection failed:", error.message);
      
      // Provide helpful error messages
      if (error.message.includes("IP") || error.message.includes("whitelist")) {
        console.error(
          "\n" +
          "═══════════════════════════════════════════════════════════════\n" +
          "  🚨 MONGODB ATLAS IP WHITELIST ERROR\n" +
          "═══════════════════════════════════════════════════════════════\n" +
          "\n" +
          "Your IP address is not whitelisted in MongoDB Atlas.\n" +
          "\n" +
          "TO FIX THIS:\n" +
          "1. Go to: https://cloud.mongodb.com/\n" +
          "2. Select your cluster\n" +
          "3. Click 'Network Access' in the left sidebar\n" +
          "4. Click 'Add IP Address'\n" +
          "5. Either:\n" +
          "   - Click 'Add Current IP Address' (recommended for development)\n" +
          "   - Or add '0.0.0.0/0' to allow all IPs (NOT recommended for production)\n" +
          "6. Click 'Confirm'\n" +
          "7. Wait 1-2 minutes for changes to take effect\n" +
          "8. Restart your server\n" +
          "\n" +
          "═══════════════════════════════════════════════════════════════\n"
        );
      }
      
      cache.promise = null;
      cache.conn = null;
      throw error;
    });
  }

  try {
    cache.conn = await cache.promise;
    console.log("[MongoDB] ✅ Successfully connected to MongoDB Atlas");
    return cache.conn;
  } catch (error) {
    cache.promise = null;
    cache.conn = null;
    throw error;
  }
}

export async function ensureMongo() {
  await connectMongo();
}
