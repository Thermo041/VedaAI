import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Using API Key:", apiKey ? apiKey.slice(0, 8) + "..." : "none");
  if (!apiKey) return;

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const models = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
  ];
  
  for (const modelName of models) {
    try {
      console.log(`Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello!");
      console.log(`✅ Success for ${modelName}:`, result.response.text());
      return;
    } catch (e: any) {
      console.log(`❌ Failed for ${modelName}:`, e.message || e);
    }
  }
}

test();
