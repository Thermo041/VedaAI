import { CreateAssignmentInput } from "@/lib/validation";
import { buildQuestionPaperPrompt } from "./prompt";
import { normalizeAnswerKey, parseGeneratedPaper } from "./parser";

// AI Provider types
type AIProvider = "groq" | "openrouter" | "gemini";

type SectionQuestionMeta = {
  isNumerical: boolean;
  isDiagram: boolean;
  sectionType: string;
};

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || text.trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("AI response did not contain JSON");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

const PRIMARY_GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const FALLBACK_GROQ_MODEL =
  process.env.GROQ_FALLBACK_MODEL || "llama-3.3-70b-versatile";
const PLACEHOLDER_ANSWER_REGEX = /^answer\s*\d+$/i;

function toOptionIndex(answer: string) {
  const trimmed = answer.trim();
  const direct = trimmed.match(/^([A-D])$/i)?.[1];
  const withWord = trimmed.match(/^option\s*([A-D])$/i)?.[1];
  const value = (direct || withWord)?.toUpperCase();
  if (!value) return null;
  return value.charCodeAt(0) - 65;
}

function isMeaningfulAnswer(answer: string | undefined) {
  if (!answer) return false;
  const trimmed = answer.trim();
  if (!trimmed) return false;
  if (PLACEHOLDER_ANSWER_REGEX.test(trimmed)) return false;
  if (/^\[object object\]$/i.test(trimmed)) return false;
  if (/^q\d+\s*:/i.test(trimmed)) return false;
  if (/see question above/i.test(trimmed)) return false;
  return true;
}

function extractNumberFromString(text?: string) {
  if (!text) return null;
  const m = String(text).match(/-?\d[\d,]*?(?:\.\d+)?/);
  if (!m) return null;
  const num = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

function safeEvalExpression(expr: string) {
  const sanitized = expr.replace(/[^0-9+\-*/().eE\s]/g, "");
  if (!/^[0-9+\-*/().eE\s]+$/.test(sanitized)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${sanitized})`);
    const result = fn();
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function computeConversionFromQuestion(text?: string) {
  if (!text) return null;
  const t = text.toLowerCase();
  const base = extractNumberFromString(t);
  if (base === null) return null;

  if (/meter|metre|\bm\b/.test(t) && /feet|foot|ft\b/.test(t)) {
    return +(base * 3.28084).toFixed(2);
  }
  if (/cm|centimeter|centimetre/.test(t) && /inch|inches|\bin\b/.test(t)) {
    return +(base * 0.393701).toFixed(2);
  }
  if (/kg|kilogram/.test(t) && /pound|lbs|lb/.test(t)) {
    return +(base * 2.20462).toFixed(2);
  }
  if (/(square\s*kilometer|sq\s*km|km2)/.test(t) && /hectare|ha\b/.test(t)) {
    return +(base * 100).toFixed(2);
  }
  if (/beats?\s*per\s*minute/.test(t) && /per\s*hour/.test(t)) {
    return +(base * 60).toFixed(0);
  }

  return null;
}

function computeNumericFromContext(text?: string) {
  if (!text) return null;
  const t = String(text);

  // Find percentage patterns like '2% of its body weight' or 'eats 2% of its body weight'
  const percentMatch = t.match(/([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:of)?\s*(?:its|the)?\s*([a-z\s]{2,30})/i);
  if (percentMatch) {
    const pct = Number(percentMatch[1]);
    const targetPhrase = percentMatch[2].trim();

    // Search for a numeric value that mentions 'weight' or unit kg/lb nearby
    // First search for number with unit kg/lb in the full text
    const unitMatch = t.match(/([0-9][0-9,]*?(?:\.[0-9]+)?)\s*(kg|kilogram|kilograms|lb|lbs|pounds)\b/i);
    if (unitMatch) {
      let base = Number(unitMatch[1].replace(/,/g, ""));
      const unit = (unitMatch[2] || "").toLowerCase();
      // convert lb to kg if needed for percentage? We'll compute in same unit
      const computed = +(base * (pct / 100));
      return { value: computed, unit };
    }

    // If no unit number found, try to find a bare number associated with 'weight' or the target phrase
    const weightRegex = new RegExp(`([0-9][0-9,]*?(?:\\.[0-9]+)?)\\s*(kg|kilogram|kilograms|lb|lbs|pounds)?[^\\n\\r]{0,40}\\b${escapeRegExp(targetPhrase)}\\b`, "i");
    const weightMatch = t.match(weightRegex);
    if (weightMatch) {
      const base = Number(weightMatch[1].replace(/,/g, ""));
      const unit = (weightMatch[2] || "kg").toLowerCase();
      return { value: +(base * (pct / 100)), unit };
    }

    // fallback: find any number in text
    const anyNum = extractNumberFromString(t);
    if (anyNum !== null) {
      return { value: +(anyNum * (pct / 100)), unit: undefined };
    }
  }

  // Try simple expression evaluation e.g., '2% of 5000' or '0.02 * 5000'
  const inlinePct = t.match(/([0-9]+(?:\.[0-9]+)?)\s*%.*?([0-9][0-9,]*?(?:\.[0-9]+)?)/);
  if (inlinePct) {
    const pct = Number(inlinePct[1]);
    const base = Number(inlinePct[2].replace(/,/g, ""));
    return { value: +(base * (pct / 100)), unit: undefined };
  }

  // No percent-based computation found
  return null;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Gemini numerical answer verification ──

async function verifyNumericalWithGemini(
  questions: { index: number; text: string; currentAnswer: string }[]
): Promise<Map<number, string>> {
  const results = new Map<number, string>();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || questions.length === 0) return results;

  const questionsBlock = questions
    .map((q, i) => `Q${i + 1}. ${q.text}`)
    .join("\n");

  const verifyPrompt = `You are a math/science calculator. For each question below, compute the EXACT numerical answer. Return ONLY a JSON array of strings, one answer per question, in order. Each answer must be the final computed value with units if applicable. No explanations, no steps, just the final answer.

Example input:
Q1. What is 15% of 200?
Q2. A rectangle has length 12cm and width 8cm. What is its area?

Example output:
["30", "96 sq cm"]

Now solve these:
${questionsBlock}

Return ONLY the JSON array:`;

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`[AI] Verifying ${questions.length} numerical answers with Gemini...`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: verifyPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[AI] Gemini verification failed (${response.status}):`, errText.slice(0, 200));
      return results;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON array from response
    const arrayMatch = text.match(/\[([\s\S]*?)\]/);
    if (!arrayMatch) {
      console.warn("[AI] Gemini returned non-array response:", text.slice(0, 200));
      return results;
    }

    const parsed = JSON.parse(arrayMatch[0]);
    if (!Array.isArray(parsed)) return results;

    parsed.forEach((answer: unknown, i: number) => {
      if (i < questions.length && typeof answer === "string" && answer.trim().length > 0) {
        results.set(questions[i].index, answer.trim());
      }
    });

    console.log(`[AI] Gemini verified ${results.size}/${questions.length} numerical answers`);
  } catch (error) {
    console.warn("[AI] Gemini numerical verification error (non-fatal):", error instanceof Error ? error.message : error);
  }

  return results;
}

// Groq API implementation
async function generateWithGroq(prompt: string, model: string, maxTokens = 4000) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required in .env.local");
  }

  console.log(`[AI] Using Groq (${model})`);

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
          content: "You are an expert assessment creator. Always respond with valid JSON only, no markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateWithGroqFallback(prompt: string) {
  try {
    return await generateWithGroq(prompt, PRIMARY_GROQ_MODEL);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isRateLimit = message.includes("429") || message.includes("rate_limit");
    if (isRateLimit && PRIMARY_GROQ_MODEL !== FALLBACK_GROQ_MODEL) {
      console.warn(
        `[AI] Groq rate-limited. Falling back to ${FALLBACK_GROQ_MODEL}...`
      );
      return await generateWithGroq(prompt, FALLBACK_GROQ_MODEL, 4000);
    }
    throw error;
  }
}

// OpenRouter API implementation
async function generateWithOpenRouter(prompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required in .env.local");
  }

  console.log("[AI] Using OpenRouter (meta-llama/llama-3.1-8b-instruct:free)");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "VedaAI Assessment Creator",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: [
        {
          role: "system",
          content: "You are an expert assessment creator. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Gemini API implementation (original)
async function generateWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required in .env.local");
  }

  console.log("[AI] Using Gemini (gemini-2.0-flash)");

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Main generation function with fallback
export async function generatePaper(input: CreateAssignmentInput) {
  const prompt = buildQuestionPaperPrompt(input);

  // Determine which provider to use
  const provider: AIProvider = (process.env.AI_PROVIDER as AIProvider) || "groq";

  const isMathSubject = input.subject && /math|mathematics|statistics|calculus|algebra|geometry|trigonometry/i.test(input.subject);

  let text: string;
  
  try {
    switch (provider) {
      case "groq":
        if (isMathSubject) {
          console.log(`[AI] Subject is Math/Stats. Using stronger Groq model: ${FALLBACK_GROQ_MODEL}`);
          text = await generateWithGroq(prompt, FALLBACK_GROQ_MODEL, 4000);
        } else {
          text = await generateWithGroqFallback(prompt);
        }
        break;
      case "openrouter":
        text = await generateWithOpenRouter(prompt);
        break;
      case "gemini":
        text = await generateWithGemini(prompt);
        break;
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  } catch (error) {
    console.error(`[AI] ${provider} failed:`, error);
    
    // Fallback to Groq if primary fails
    if (provider !== "groq" && process.env.GROQ_API_KEY) {
      console.log("[AI] Falling back to Groq...");
      text = await generateWithGroqFallback(prompt);
    } else {
      throw error;
    }
  }

  const parseFromText = (content: string) => {
    const parsedRaw = extractJson(content);
    const parsedPaper = parseGeneratedPaper(parsedRaw);
    return { parsedRaw, parsedPaper };
  };

  let raw: any;
  let paper: ReturnType<typeof parseGeneratedPaper>;

  try {
    const result = parseFromText(text);
    raw = result.parsedRaw;
    paper = result.parsedPaper;
  } catch (parseError) {
    console.warn("[AI] Output parsing failed. Retrying with fallback model...");

    if (process.env.GROQ_API_KEY) {
      const fallbackText =
        provider === "groq"
          ? await generateWithGroq(prompt, FALLBACK_GROQ_MODEL, 4000)
          : await generateWithGroqFallback(prompt);
      const result = parseFromText(fallbackText);
      raw = result.parsedRaw;
      paper = result.parsedPaper;
    } else {
      console.error("[AI] No fallback available (GROQ_API_KEY not set)");
      throw parseError;
    }
  }

  // Enforce lettered section names (Section A, Section B, ...)
  const letters = input.questionTypes.map((_, i) =>
    String.fromCharCode(65 + i)
  );
  paper.sections = paper.sections.map((section, index) => ({
    ...section,
    id: `section-${letters[index]?.toLowerCase() || String(index + 1)}`,
    name:
      letters[index]
        ? `Section ${letters[index]}: ${input.questionTypes[index]?.type || "Questions"}`
        : section.name,
  }));

  const subject = input.subject?.trim();
  if (subject) {
    paper.metadata.subject = subject;
  }
  const classLevel = input.classLevel?.trim();
  if (classLevel) {
    paper.metadata.class = classLevel;
  }
  const timeAllowed = input.timeAllowed?.trim();
  if (timeAllowed) {
    paper.metadata.timeAllowed = timeAllowed;
  }

  const totalQuestions = paper.sections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );

  // Map each question index to its section type for answer validation
  const questionMeta: SectionQuestionMeta[] = [];
  paper.sections.forEach((section) => {
    const sectionType = input.questionTypes.find((qt) =>
      section.name.toLowerCase().includes(qt.type.toLowerCase().split(" ")[0])
    )?.type || section.name;
    const isNumerical = /numerical|calculate|problem/i.test(section.name);
    const isDiagram = /diagram|graph|draw|sketch|illustrat/i.test(section.name);
    section.questions.forEach(() => questionMeta.push({ isNumerical, isDiagram, sectionType }));
  });

  const normalizedAnswerKey = normalizeAnswerKey(raw);
  const answersFromQuestions = paper.sections.flatMap((section) =>
    section.questions.map((question) =>
      typeof question.answer === "string" ? question.answer.trim() : ""
    )
  );

  // Use embedded question answers as primary source (guaranteed aligned with questions).
  // Only fall back to normalizedAnswerKey if embedded answer is empty.
  const finalAnswerKey = Array.from({ length: totalQuestions }, (_, index) => {
    const meta = questionMeta[index];
    const fromQuestion = answersFromQuestions[index];
    const direct = normalizedAnswerKey[index];
    const directStr = typeof direct === "string" ? direct : "";

    if (meta?.isNumerical) {
      if (isMeaningfulAnswer(fromQuestion) && /\d/.test(fromQuestion)) return fromQuestion;
      if (isMeaningfulAnswer(directStr) && /\d/.test(directStr)) return directStr.trim();
      if (isMeaningfulAnswer(fromQuestion)) return fromQuestion;
      if (isMeaningfulAnswer(directStr)) return directStr.trim();
      return "See detailed solution";
    }

    if (isMeaningfulAnswer(fromQuestion)) return fromQuestion;
    if (isMeaningfulAnswer(directStr)) return directStr.trim();
    return `Answer ${index + 1}`;
  });

  // ── Gemini verification for numerical answers ──
  if (process.env.GEMINI_API_KEY) {
    const numericalQuestions: { index: number; text: string; currentAnswer: string }[] = [];
    let qIdx = 0;
    paper.sections.forEach((section) => {
      section.questions.forEach((q) => {
        const meta = questionMeta[qIdx];
        if (meta?.isNumerical) {
          numericalQuestions.push({
            index: qIdx,
            text: q.text || `Question ${qIdx + 1}`,
            currentAnswer: finalAnswerKey[qIdx],
          });
        }
        qIdx++;
      });
    });

    if (numericalQuestions.length > 0) {
      try {
        const geminiAnswers = await verifyNumericalWithGemini(numericalQuestions);
        for (const [index, answer] of geminiAnswers) {
          if (answer && answer.length > 0) {
            finalAnswerKey[index] = answer;
          }
        }
      } catch (err) {
        console.warn("[AI] Gemini verification skipped:", err instanceof Error ? err.message : err);
      }
    }
  }

  const fallbackOpts = ["Option A", "Option B", "Option C", "Option D"];

  let qi = -1;
  const enrichedSections = paper.sections.map((section) => {
    const isMcq = /multiple\s*choice|mcq/i.test(section.name);
    const isTf = /true\s*\/?\s*false|t\s*\/\s*f/i.test(section.name);
    const needsOptions = isMcq || isTf;

    const mappedQuestions = section.questions.map((q) => {
      qi++;
      const number = qi + 1;

      // Only keep AI-provided options for MCQ/TF sections
      let options = needsOptions
        ? (q.options?.slice(0, 4).filter(Boolean) as string[] | undefined)
        : undefined;
      let answer = finalAnswerKey[qi];
      const meta = questionMeta[qi];
      // if numerical and placeholder, try extracting/evaluating
      if (/compute using formula|see detailed solution/i.test(String(answer)) || (meta?.isNumerical && !isMeaningfulAnswer(answer))) {
        // try direct normalized answer
        const extracted = extractNumberFromString(normalizedAnswerKey[qi]) ?? extractNumberFromString(answersFromQuestions[qi]);
        if (extracted !== null) {
          answer = String(extracted);
        } else {
          // try computing from question text
          const questionText = q.text || "";
          // percent-based computations
          const pct = computeNumericFromContext(questionText);
          if (pct && pct.value !== undefined) {
            answer = pct.unit ? `${pct.value} ${pct.unit}` : String(pct.value);
          } else {
            const computed = computeConversionFromQuestion(questionText) ?? safeEvalExpression(questionText);
            if (computed !== null) answer = String(computed);
          }
        }
      }

      if (isTf) {
        options = ["True", "False"];
        const lower = answer.trim().toLowerCase();
        if (lower === "true" || lower === "false") {
          answer = lower === "true" ? "True" : "False";
        } else {
          const optionIndex = toOptionIndex(answer);
          answer = optionIndex === 1 ? "False" : "True";
        }
      } else if (isMcq) {
        if (options && options.length === 4) {
          // AI provided valid options — keep them
        } else {
          // Build options from answer key or fallback
          const correct = answer;
          const isGeneric = !isMeaningfulAnswer(correct);
          if (isGeneric) {
            options = [...fallbackOpts];
          } else {
            const distractors = fallbackOpts.filter(
              (o) => o.toLowerCase() !== correct.toLowerCase()
            ).slice(0, 3);
            options = [correct, ...distractors];
            for (let i = options.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [options[i], options[j]] = [options[j], options[i]];
            }
          }
        }

        if (options && options.length > 0) {
          const optionIndex = toOptionIndex(answer);
          if (optionIndex !== null && options[optionIndex]) {
            answer = options[optionIndex];
          } else if (!isMeaningfulAnswer(answer)) {
            answer = options[0];
          } else if (
            !options.some((option) => option.toLowerCase() === answer.toLowerCase())
          ) {
            options = [
              answer,
              ...options.filter(
                (option) => option.toLowerCase() !== answer.toLowerCase()
              ).slice(0, 3),
            ];
          }
        }
      } else {
        // Non-MCQ/non-TF sections: strip any options the AI sent
        options = undefined;
      }

      finalAnswerKey[qi] = answer;

      // Remove options from spread to avoid inheriting AI's options for wrong sections
      const { options: _stripOpts, ...qWithoutOptions } = q;
      return { ...qWithoutOptions, number, ...(options && options.length > 0 ? { options } : {}) };
    });

    // Ensure mixed difficulties ("Easy", "Moderate", "Challenging")
    // If the section questions are not well mixed, balance them.
    const diffList = ["Easy", "Moderate", "Challenging"] as const;
    const counts: Record<string, number> = { Easy: 0, Moderate: 0, Challenging: 0 };
    for (const q of mappedQuestions) {
      counts[q.difficulty || "Moderate"]++;
    }
    const maxCount = Math.max(...Object.values(counts));
    const isSkewed = mappedQuestions.length >= 3 && maxCount >= mappedQuestions.length * 0.8;
    if (isSkewed) {
      mappedQuestions.forEach((q, idx) => {
        q.difficulty = diffList[idx % diffList.length];
      });
    }

    return {
      ...section,
      questions: mappedQuestions,
    };
  });

  return {
    paper: { ...paper, sections: enrichedSections },
    answerKey: finalAnswerKey,
  };
}
