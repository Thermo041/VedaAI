import { z } from "zod";

const difficultySchema = z.enum(["Easy", "Moderate", "Challenging"]);

const difficultyMap: Record<string, z.infer<typeof difficultySchema>> = {
  easy: "Easy",
  moderate: "Moderate",
  medium: "Moderate",
  challenging: "Challenging",
  hard: "Challenging",
};

type UnknownRecord = Record<string, unknown>;

const QUESTION_TEXT_KEYS = [
  "text",
  "question",
  "questionText",
  "question_text",
  "prompt",
  "content",
  "statement",
  "stem",
  "body",
  "problem",
  "description",
  "title",
  "q",
] as const;

const ANSWER_KEYS = [
  "answer",
  "correctAnswer",
  "correct_answer",
  "correct",
  "solution",
  "value",
] as const;

const MCQ_OPTION_FALLBACK = ["Option A", "Option B", "Option C", "Option D"];
const TF_OPTION_FALLBACK = ["True", "False"];

function asRecord(value: unknown): UnknownRecord | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as UnknownRecord;
  }
  return null;
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function readFirstString(
  record: UnknownRecord,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = toNonEmptyString(record[key]);
    if (value) return value;
  }
  return undefined;
}

function normalizeDifficulty(value: unknown) {
  if (typeof value === "string") {
    const key = value.trim().toLowerCase();
    if (difficultyMap[key]) return difficultyMap[key];
  }
  return "Moderate" as const;
}

function normalizeMarks(value: unknown) {
  const marks = Math.trunc(Number(value));
  if (Number.isFinite(marks) && marks > 0) return marks;
  return 1;
}

function normalizeNumber(value: unknown, fallback: number) {
  if (value === undefined || value === null) return fallback;
  // Handle string values like "Q1", "1.", "#3" etc.
  if (typeof value === "string") {
    const extracted = value.match(/\d+/);
    if (extracted) {
      const num = Math.trunc(Number(extracted[0]));
      if (Number.isFinite(num) && num > 0) return num;
    }
    return fallback;
  }
  const num = Math.trunc(Number(value));
  if (Number.isFinite(num) && num > 0) return num;
  return fallback;
}

function normalizeOptionItem(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  const record = asRecord(value);
  if (record) {
    return readFirstString(record, [
      "text",
      "label",
      "value",
      "option",
      "choice",
    ]);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function normalizeOptions(raw: unknown): string[] | undefined {
  if (Array.isArray(raw)) {
    const options = raw
      .map((item) => normalizeOptionItem(item))
      .filter((item): item is string => Boolean(item));
    return options.length > 0 ? options : undefined;
  }

  const record = asRecord(raw);
  if (record) {
    const options = Object.values(record)
      .map((item) => normalizeOptionItem(item))
      .filter((item): item is string => Boolean(item));
    return options.length > 0 ? options : undefined;
  }

  if (typeof raw === "string") {
    const pieces = raw
      .split(/\r?\n|[;|]/g)
      .map((piece) => piece.trim())
      .filter(Boolean);
    return pieces.length >= 2 ? pieces : undefined;
  }

  return undefined;
}

function extractTextFromAnyField(record: UnknownRecord): string | undefined {
  // Last resort: find the first long-ish string value in the record
  for (const value of Object.values(record)) {
    if (typeof value === "string" && value.trim().length > 5) {
      return value.trim();
    }
  }
  // Even shorter strings
  for (const value of Object.values(record)) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeQuestion(raw: unknown, index: number) {
  if (typeof raw === "string") {
    const text = raw.trim();
    return {
      number: index + 1,
      text: text.length > 0 ? text : `Question ${index + 1}`,
      difficulty: "Moderate" as const,
      marks: 1,
    };
  }

  // Handle number/boolean primitives
  if (typeof raw === "number" || typeof raw === "boolean") {
    return {
      number: index + 1,
      text: String(raw),
      difficulty: "Moderate" as const,
      marks: 1,
    };
  }

  const source = asRecord(raw) || {};
  
  // Check for multiple nesting patterns the AI might use
  const nestedQuestion = asRecord(source.question);
  const nestedProblem = asRecord(source.problem);
  const nestedItem = asRecord(source.item);
  const nested = nestedQuestion || nestedProblem || nestedItem;
  const data = nested
    ? ({ ...source, ...nested } as UnknownRecord)
    : source;

  // Try multiple strategies for finding question text
  let text =
    readFirstString(data, QUESTION_TEXT_KEYS) ||
    readFirstString(source, QUESTION_TEXT_KEYS);
  
  // If nested objects exist, dig into them for text
  if (!text && nested) {
    text = readFirstString(nested, QUESTION_TEXT_KEYS);
  }

  // If still no text, try to find ANY string value that looks like a question
  if (!text) {
    text = extractTextFromAnyField(data) || extractTextFromAnyField(source);
  }
  
  // If the "question" field is a string (not an object), use it directly
  if (!text && typeof source.question === "string") {
    text = source.question.trim() || undefined;
  }

  const options = normalizeOptions(
    data.options ??
      data.choices ??
      data.choice ??
      data.alternatives ??
      data.mcqOptions ??
      source.options ??
      source.choices
  );

  const answer =
    readFirstString(data, ANSWER_KEYS) ||
    readFirstString(source, ANSWER_KEYS) ||
    readFirstString(asRecord(data.correct) || {}, ["answer", "text", "value"]) ||
    readFirstString(asRecord(source.correct) || {}, ["answer", "text", "value"]);

  const number = normalizeNumber(
    data.number ??
      data.no ??
      data.qNo ??
      data.questionNo ??
      data.questionNumber ??
      data.q_no ??
      data.question_number ??
      data.sno ??
      data.sr ??
      data.id ??
      source.number ??
      source.no ??
      source.id,
    index + 1
  );

  return {
    number,
    text: text || `Question ${number}`,
    difficulty: normalizeDifficulty(
      data.difficulty ?? data.level ?? data.complexity ?? data.difficultyLevel ?? source.difficulty
    ),
    marks: normalizeMarks(data.marks ?? data.points ?? data.mark ?? data.score ?? source.marks),
    ...(options?.length ? { options } : {}),
    ...(answer ? { answer } : {}),
  };
}

function normalizeSection(raw: unknown, index: number) {
  const data = asRecord(raw) || {};
  const sectionLabel = `Section ${String.fromCharCode(65 + index)}:`;
  const name =
    readFirstString(data, ["name", "title", "section", "heading", "sectionName", "section_name"]) ||
    sectionLabel;
  const instruction =
    readFirstString(data, ["instruction", "note", "directions", "description", "instructions"]) ||
    "Attempt all questions.";
  
  // Try multiple keys for finding the questions array
  let rawQuestions: unknown[] = [];
  for (const key of ["questions", "items", "problems", "questionList", "question_list"]) {
    if (Array.isArray(data[key]) && (data[key] as unknown[]).length > 0) {
      rawQuestions = data[key] as unknown[];
      break;
    }
  }
  // Fallback: single question object
  if (rawQuestions.length === 0 && data.question) {
    rawQuestions = [data.question];
  }
  // Fallback: if data itself has numbered keys like "1", "2", "3" (object-style questions)
  if (rawQuestions.length === 0) {
    const numberedEntries = Object.entries(data)
      .filter(([key]) => /^\d+$/.test(key))
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, value]) => value);
    if (numberedEntries.length > 0) {
      rawQuestions = numberedEntries;
    }
  }

  // Always coerce section id to string
  const rawId = data.id ?? data.sectionId ?? data.section_id;
  const sectionId = rawId !== undefined && rawId !== null ? String(rawId) : undefined;

  return {
    id: sectionId,
    name,
    instruction,
    questions:
      rawQuestions.length > 0
        ? rawQuestions.map((q, questionIndex) =>
            normalizeQuestion(q, questionIndex)
          )
        : [],
  };
}

function normalizePaper(raw: unknown) {
  const data = asRecord(raw) || {};
  const metadata = asRecord(data.metadata) || {};
  const sectionsObject = asRecord(data.sections);
  
  let sectionsSource: unknown[];
  
  if (Array.isArray(data.sections) && data.sections.length > 0) {
    sectionsSource = data.sections;
  } else if (sectionsObject) {
    sectionsSource = Object.entries(sectionsObject).map(([sectionName, sectionValue]) => {
      const sectionRecord = asRecord(sectionValue);
      if (!sectionRecord) {
        return {
          name: sectionName,
          instruction: "Attempt all questions.",
          questions: Array.isArray(sectionValue)
            ? sectionValue
            : [sectionValue],
        };
      }
      // Look for questions under multiple keys
      let questions: unknown[] = [];
      for (const key of ["questions", "items", "problems", "questionList"]) {
        if (Array.isArray(sectionRecord[key])) {
          questions = sectionRecord[key] as unknown[];
          break;
        }
      }
      return {
        ...sectionRecord,
        name:
          readFirstString(sectionRecord, ["name", "title", "section"]) ||
          sectionName,
        questions,
      };
    });
  } else if (Array.isArray(data.questions)) {
    sectionsSource = [
      {
        name: "Section A:",
        instruction: "Attempt all questions.",
        questions: data.questions,
      },
    ];
  } else if (Array.isArray(data.problems)) {
    // Some AI responses put questions under "problems" at root level
    sectionsSource = [
      {
        name: "Section A:",
        instruction: "Attempt all questions.",
        questions: data.problems,
      },
    ];
  } else {
    sectionsSource = [];
  }

  const maxMarks = Number(metadata.maxMarks ?? data.maxMarks);

  return {
    metadata: {
      subject:
        readFirstString(metadata, ["subject"]) ||
        readFirstString(data, ["subject"]) ||
        "General",
      class:
        readFirstString(metadata, ["class"]) ||
        readFirstString(data, ["class", "classLevel"]) ||
        "Not specified",
      timeAllowed:
        readFirstString(metadata, ["timeAllowed"]) ||
        readFirstString(data, ["timeAllowed"]) ||
        "Not specified",
      maxMarks: Number.isFinite(maxMarks) ? maxMarks : 0,
    },
    sections: sectionsSource.map((section, index) =>
      normalizeSection(section, index)
    ),
  };
}

function cleanAnswerValue(value: string) {
  return value.replace(/^\s*\d+[\)\].:\-\s]*/, "").trim();
}

function isUsefulAnswer(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "[object object]") return false;
  if (/^answer\s*\d+$/.test(normalized)) return false;
  if (normalized === "n/a" || normalized === "not provided") return false;
  return true;
}

function flattenAnswerSource(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length > 1) return lines;
    return [raw];
  }

  const record = asRecord(raw);
  if (!record) return [];

  for (const key of ["answerKey", "answers", "answer_key", "solutions"]) {
    if (key in record) {
      return flattenAnswerSource(record[key]);
    }
  }

  return Object.entries(record)
    .sort(([a], [b]) => {
      const aNum = Number(a);
      const bNum = Number(b);
      if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
        return aNum - bNum;
      }
      return a.localeCompare(b);
    })
    .map(([, value]) => value);
}

function normalizeAnswerItem(value: unknown): string | undefined {
  if (typeof value === "string") {
    const cleaned = cleanAnswerValue(value);
    return isUsefulAnswer(cleaned) ? cleaned : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  const record = asRecord(value);
  if (!record) return undefined;

  const direct =
    readFirstString(record, ANSWER_KEYS) ||
    readFirstString(record, ["text", "response", "option", "choice"]);
  if (direct) {
    const cleaned = cleanAnswerValue(direct);
    return isUsefulAnswer(cleaned) ? cleaned : undefined;
  }

  const nestedCorrect = asRecord(record.correct);
  if (nestedCorrect) {
    const nested = readFirstString(nestedCorrect, ["answer", "text", "value"]);
    if (nested) {
      const cleaned = cleanAnswerValue(nested);
      return isUsefulAnswer(cleaned) ? cleaned : undefined;
    }
  }

  return undefined;
}

export function normalizeAnswerKey(raw: unknown): (string | undefined)[] {
  return flattenAnswerSource(raw)
    .map((item) => normalizeAnswerItem(item));
}

export const generatedPaperSchema = z.object({
  metadata: z.object({
    subject: z.string(),
    class: z.string(),
    timeAllowed: z.string(),
    maxMarks: z.coerce.number(),
  }),
  sections: z.array(
    z.object({
      id: z.coerce.string().optional(),
      name: z.string(),
      instruction: z.string(),
      questions: z.array(
        z.object({
          number: z.coerce.number(),
          text: z.string().min(1),
          difficulty: difficultySchema,
          marks: z.coerce.number(),
          options: z.array(z.string()).optional(),
          answer: z.string().optional(),
        })
      ),
    })
  ),
});

export function parseGeneratedPaper(raw: unknown) {
  const normalized = normalizePaper(raw);
  const result = generatedPaperSchema.safeParse(normalized);
  const base = result.success ? result.data : normalized;

  // Track continuous numbering across all sections
  let globalQuestionNumber = 0;

  const sections = base.sections.map((section, index) => {
    const isMcq = /multiple\s*choice|mcq/i.test(section.name);
    const isTrueFalse = /true\s*\/?\s*false|t\s*\/\s*f/i.test(section.name);

    return {
      ...section,
      id:
        section.id && String(section.id).trim().length > 0
          ? String(section.id)
          : `section-${index + 1}`,
      questions: section.questions.map((question) => {
        globalQuestionNumber += 1;
        const text =
          typeof question.text === "string" && question.text.trim().length > 0
            ? question.text.trim()
            : `Question ${globalQuestionNumber}`;
        const options = Array.isArray(question.options)
          ? question.options
              .map((option) => (typeof option === "string" ? option.trim() : String(option)))
              .filter((option): option is string => option.length > 0)
          : undefined;
        const answer = toNonEmptyString(question.answer);

        let normalizedOptions = options;
        if (isTrueFalse) {
          normalizedOptions = [...TF_OPTION_FALLBACK];
        } else if (isMcq && (!normalizedOptions || normalizedOptions.length < 2)) {
          normalizedOptions = [...MCQ_OPTION_FALLBACK];
        } else if (!isMcq && !isTrueFalse) {
          // Strip options from non-MCQ/non-TF sections (Diagram, Numerical, Short, Long)
          normalizedOptions = undefined;
        }

        const { options: _oldOptions, ...questionWithoutOptions } = question;

        return {
          ...questionWithoutOptions,
          number: globalQuestionNumber,
          text,
          difficulty: normalizeDifficulty(question.difficulty),
          marks: normalizeMarks(question.marks),
          ...(normalizedOptions ? { options: normalizedOptions } : {}),
          ...(answer ? { answer } : {}),
        };
      }),
    };
  });

  const computedMaxMarks = sections.reduce(
    (total, section) =>
      total +
      section.questions.reduce(
        (sectionTotal, question) => sectionTotal + normalizeMarks(question.marks),
        0
      ),
    0
  );

  return {
    ...base,
    metadata: {
      ...base.metadata,
      maxMarks:
        Number.isFinite(Number(base.metadata.maxMarks)) &&
        Number(base.metadata.maxMarks) > 0
          ? Number(base.metadata.maxMarks)
          : computedMaxMarks,
    },
    sections,
  };
}