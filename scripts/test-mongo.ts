import mongoose from "mongoose";
import { AssignmentModel } from "../models/Assignment";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || "vedaai",
      serverSelectionTimeoutMS: 10000,
    });
    const docs = await AssignmentModel.find().limit(5);
    console.log("ok", docs.length);
  } catch (error) {
    console.error("ERR", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
