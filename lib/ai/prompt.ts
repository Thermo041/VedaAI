import { CreateAssignmentInput } from "@/lib/validation";

const MAX_SOURCE_CHARS = 4000;

function sectionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function trimSourceContent(value?: string) {
  const trimmed = (value || "").trim();
  return trimmed.length > 0 ? trimmed.slice(0, MAX_SOURCE_CHARS) : "";
}

export function buildQuestionPaperPrompt(input: CreateAssignmentInput) {
  const requestedTypes = input.questionTypes
    .map(
      (item, index) =>
        `Section ${sectionLetter(index)}: ${item.type} — ${item.count} questions, ${item.marks} marks each`
    )
    .join("\n");
  const sourceContent = trimSourceContent(input.additionalInfo);

  const totalCount = input.questionTypes.reduce((sum, qt) => sum + qt.count, 0);

  // Build section-specific guidance
  const sectionGuidance = input.questionTypes
    .map((item, index) => {
      const letter = sectionLetter(index);
      const t = item.type.toLowerCase();
      if (t.includes("multiple choice") || t.includes("mcq")) {
        return `Section ${letter} (${item.type}): Each question MUST have "options": ["A","B","C","D"] with 4 meaningful choices. Answer = correct option text.`;
      }
      if (t.includes("true") && t.includes("false")) {
        return `Section ${letter} (${item.type}): Each question is a statement. MUST have "options": ["True","False"]. Answer = "True" or "False".`;
      }
      if (t.includes("diagram") || t.includes("graph")) {
        return `Section ${letter} (${item.type}): Questions MUST ask students to DRAW, SKETCH, LABEL, PLOT, or CONSTRUCT something visual. Use verbs like "Draw a labeled diagram of...", "Sketch the graph of...", "Plot the curve showing...", "Construct a ray diagram for...". Do NOT ask factual/text questions. NO "options" field. Answer = brief description of what should be drawn.`;
      }
      if (t.includes("numerical") || t.includes("problem")) {
        return `Section ${letter} (${item.type}): Questions MUST be math/science calculation problems with specific numbers. Example: "A car travels 60 km/h for 2.5 hours. Calculate the distance." Include ALL numerical data needed to solve. Answer = computed result with units. NO "options" field.`;
      }
      return `Section ${letter} (${item.type}): Standard text questions. NO "options" field. Answer = concise correct answer.`;
    })
    .join("\n");

  return `
Generate a question paper in JSON. CRITICAL: Return ONLY valid JSON, no extra text.

EXACT FORMAT:
{
  "metadata": {"subject":"...","class":"...","timeAllowed":"...","maxMarks":${input.questionTypes.reduce((s, q) => s + q.count * q.marks, 0)}},
  "sections": [
    {
      "id": "section-a", "name": "Section A: Multiple Choice Questions",
      "instruction": "Choose the correct option.",
      "questions": [
        {"number": 1, "text": "What is the SI unit of force?", "difficulty": "Easy", "marks": 1, "options": ["Joule","Newton","Watt","Pascal"], "answer": "Newton"},
        {"number": 2, "text": "Which planet is closest to the Sun?", "difficulty": "Moderate", "marks": 1, "options": ["Venus","Mercury","Mars","Earth"], "answer": "Mercury"}
      ]
    },
    {
      "id": "section-b", "name": "Section B: Diagram/Graph-Based Questions",
      "instruction": "Draw neat and labeled diagrams.",
      "questions": [
        {"number": 3, "text": "Draw a labeled diagram showing the structure of a human eye. Mark the cornea, lens, retina, and optic nerve.", "difficulty": "Moderate", "marks": 5, "answer": "Labeled diagram of human eye showing cornea, lens, retina, and optic nerve"},
        {"number": 4, "text": "Sketch the velocity-time graph for a body undergoing uniform acceleration from rest for 10 seconds.", "difficulty": "Challenging", "marks": 5, "answer": "Graph showing straight line from origin with positive slope"}
      ]
    },
    {
      "id": "section-c", "name": "Section C: Numerical Problems",
      "instruction": "Solve the following. Show your work.",
      "questions": [
        {"number": 5, "text": "A rectangular field is 120m long and 80m wide. Calculate its area in hectares.", "difficulty": "Easy", "marks": 5, "answer": "0.96 hectares"},
        {"number": 6, "text": "A train travels at 90 km/h for 2 hours and 30 minutes. Find the total distance covered.", "difficulty": "Moderate", "marks": 5, "answer": "225 km"}
      ]
    }
  ]
}

SECTION-SPECIFIC RULES:
${sectionGuidance}

GENERAL RULES:
- "options" is ONLY for Multiple Choice and True/False. All other sections must NOT have "options"
- DIFFICULTY MIX: Each section MUST mix "Easy", "Moderate", and "Challenging" — roughly equal. NEVER make all same difficulty
- You MUST provide an "answer" field inside EVERY SINGLE question object.
- Question numbers must be sequential across ALL sections (1, 2, 3... not restarting per section)
- For Numerical answers: you MUST compute the actual numeric result (e.g. "225 km", "0.96 hectares"). Never write "calculate" or "solve" in the answer

Title: "${input.title}"
Subject: "${input.subject || "Not specified"}"
Class: "${input.classLevel}"
Time: "${input.timeAllowed}"

${requestedTypes}

${sourceContent ? `Content to base questions on: ${sourceContent}` : ""}
`.trim();
}
