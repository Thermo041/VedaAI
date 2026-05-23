import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { topic, subject, grade, duration, objectives, resources } = await req.json();

    if (!topic || !subject) {
      return NextResponse.json(
        { error: "Topic and subject are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is required");
    }

    const prompt = `You are an expert educator. Create a detailed, structured lesson plan for the following:

Topic: ${topic}
Subject: ${subject}
Grade Level: ${grade || "Not specified"}
Duration: ${duration || "45 minutes"}
${objectives ? `Learning Objectives: ${objectives}` : ""}
${resources ? `Available Resources: ${resources}` : ""}

Generate a comprehensive lesson plan with these sections:
1. LESSON PLAN TITLE
2. SUBJECT & GRADE
3. DURATION
4. LEARNING OBJECTIVES (specific, measurable outcomes)
5. MATERIALS/RESOURCES NEEDED
6. INTRODUCTION/WARM-UP (with time allocation)
7. MAIN INSTRUCTIONAL ACTIVITIES (with time allocation and detailed steps)
8. ASSESSMENT/EVALUATION (formative and summative)
9. CLOSURE/WRAP-UP
10. HOMEWORK/EXTENSION ACTIVITIES
11. DIFFERENTIATION STRATEGIES (for diverse learners)

Make it practical, engaging, and aligned to educational standards. Use clear formatting with headings and bullet points.`;

    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    let plan = "";
    let lastError = "";

    for (const model of models) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are an expert educator who creates detailed, practical lesson plans."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1600,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `${model}: ${response.status} ${errorText}`;
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) {
        plan = content;
        break;
      }

      lastError = `${model}: empty completion`;
    }

    if (!plan) {
      throw new Error(lastError || "No response from AI provider");
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate lesson plan",
      },
      { status: 500 }
    );
  }
}
