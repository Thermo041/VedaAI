import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function list() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  const versions = ["v1", "v1beta"];
  for (const v of versions) {
    try {
      console.log(`\n--- Fetching models for version: ${v} ---`);
      const url = `https://generativelanguage.googleapis.com/${v}/models?key=${apiKey}`;
      const res = await fetch(url);
      console.log("Status:", res.status);
      const data = await res.json();
      if (res.ok) {
        const names = data.models?.map((m: any) => m.name) || [];
        console.log("Models:", names);
      } else {
        console.log("Error:", data);
      }
    } catch (e: any) {
      console.log("Failed:", e.message || e);
    }
  }
}

list();
