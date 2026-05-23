/**
 * Setup Verification Script
 * Run this to verify all services are properly configured
 * Usage: npx tsx scripts/verify-setup.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectMongo } from "../lib/db/mongodb";
import { ensureRedis } from "../lib/db/redis";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function verifyMongoDB() {
  console.log("\n🔍 Verifying MongoDB connection...");
  try {
    await connectMongo();
    console.log("✅ MongoDB: Connected successfully");
    return true;
  } catch (error) {
    console.error("❌ MongoDB: Connection failed");
    console.error(error instanceof Error ? error.message : error);
    return false;
  }
}

async function verifyRedis() {
  console.log("\n🔍 Verifying Redis connection...");
  try {
    const redis = await ensureRedis();
    await redis.ping();
    console.log("✅ Redis: Connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Redis: Connection failed");
    console.error(error instanceof Error ? error.message : error);
    return false;
  }
}

async function verifyGemini() {
  console.log("\n🔍 Verifying Gemini API...");
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ Gemini: GEMINI_API_KEY not found in environment");
    return false;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash" 
    });
    
    const result = await model.generateContent("Say 'test' in JSON format: {\"message\": \"test\"}");
    const text = result.response.text();
    
    if (text.includes("test")) {
      console.log("✅ Gemini: API key is valid and working");
      return true;
    } else {
      console.error("❌ Gemini: Unexpected response from API");
      return false;
    }
  } catch (error) {
    console.error("❌ Gemini: API call failed");
    console.error(error instanceof Error ? error.message : error);
    return false;
  }
}

function verifyEnvironment() {
  console.log("\n🔍 Verifying environment variables...");
  const required = [
    "JWT_SECRET",
    "GEMINI_API_KEY",
    "MONGODB_URI",
    "REDIS_URL",
  ];

  let allPresent = true;
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`❌ Missing: ${key}`);
      allPresent = false;
    } else {
      console.log(`✅ Found: ${key}`);
    }
  }

  return allPresent;
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🚀 VEDAAI SETUP VERIFICATION");
  console.log("═══════════════════════════════════════════════════════════");

  const envOk = verifyEnvironment();
  const mongoOk = await verifyMongoDB();
  const redisOk = await verifyRedis();
  const geminiOk = await verifyGemini();

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  📊 VERIFICATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Environment Variables: ${envOk ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`MongoDB Connection:    ${mongoOk ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Redis Connection:      ${redisOk ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Gemini API:            ${geminiOk ? "✅ PASS" : "❌ FAIL"}`);
  console.log("═══════════════════════════════════════════════════════════");

  if (envOk && mongoOk && redisOk && geminiOk) {
    console.log("\n🎉 ALL CHECKS PASSED! Your setup is ready.");
    console.log("You can now run: npm run dev\n");
    process.exit(0);
  } else {
    console.log("\n⚠️  SOME CHECKS FAILED. Please fix the issues above.");
    console.log("Refer to the error messages for guidance.\n");
    process.exit(1);
  }
}

main();
