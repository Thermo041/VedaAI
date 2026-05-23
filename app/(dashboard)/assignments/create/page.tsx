"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/form/FileUpload";
import { QuestionTypeRow } from "@/components/form/QuestionTypeRow";
import { GenerationOverlay } from "@/components/assignment/GenerationOverlay";
import { useAssignmentStore } from "@/stores/useAssignmentStore";
import { useGenerationStore } from "@/stores/useGenerationStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useGenerationSocket, pollJobStatus } from "@/hooks/useGenerationSocket";
import { QuestionType } from "@/types";

const MAX_SOURCE_CHARS = 4000;

export default function CreateAssignmentPage() {
  const router = useRouter();
  const addAssignment = useAssignmentStore((state) => state.addAssignment);
  const setCurrentAssignment = useAssignmentStore(
    (state) => state.setCurrentAssignment
  );
  const setIsGenerating = useGenerationStore((state) => state.setIsGenerating);
  const setProgress = useGenerationStore((state) => state.setProgress);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(
    null
  );
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [timeAllowed, setTimeAllowed] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    { type: "Multiple Choice Questions", count: 4, marks: 1 },
    { type: "Short Questions", count: 3, marks: 2 },
    { type: "Diagram/Graph-Based Questions", count: 5, marks: 5 },
    { type: "Numerical Problems", count: 5, marks: 5 },
  ]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const sourceCharCount = additionalInfo.length;

  const setMCQOnly = () => {
    setQuestionTypes([
      { type: "Multiple Choice Questions", count: 20, marks: 1 },
    ]);
  };
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestionTypeSelector, setShowQuestionTypeSelector] = useState(false);

  const questionTypeOptions = [
    "Multiple Choice Questions",
    "Short Questions",
    "Diagram/Graph-Based Questions",
    "Numerical Problems",
    "Long Answer Questions",
    "True/False",
  ];

  useGenerationSocket(activeAssignmentId);

  const totalQuestions = questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const totalMarks = questionTypes.reduce(
    (sum, qt) => sum + qt.count * qt.marks,
    0
  );

  const addQuestionType = (type: string) => {
    setQuestionTypes([
      ...questionTypes,
      { type, count: 1, marks: 1 },
    ]);
    setShowQuestionTypeSelector(false);
  };

  const updateQuestionType = (index: number, updates: Partial<QuestionType>) => {
    const updated = [...questionTypes];
    updated[index] = { ...updated[index], ...updates };
    setQuestionTypes(updated);
  };

  const removeQuestionType = (index: number) => {
    if (questionTypes.length === 1) return;
    setQuestionTypes(questionTypes.filter((_, i) => i !== index));
  };

  const updateSourceContent = (value: string) => {
    setAdditionalInfo(value.slice(0, MAX_SOURCE_CHARS));
  };

  const waitForCompletion = async (assignmentId: string) => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const status = await pollJobStatus(assignmentId);
      setProgress({
        assignmentId,
        status: status.status,
        progress: status.progress,
        message: status.message,
      });

      if (status.status === "completed" && status.assignment) {
        return status.assignment;
      }

      if (status.status === "failed") {
        throw new Error(status.message || "Generation failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("Generation timed out. Please try again.");
  };

  const handleNext = async () => {
    if (!title.trim()) {
      setError("Please enter an assignment title.");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter the subject.");
      return;
    }

    if (!dueDate) {
      setError("Please choose a due date before generating the paper.");
      return;
    }

    if (!classLevel.trim()) {
      setError("Please enter the class or grade.");
      return;
    }

    if (!timeAllowed.trim()) {
      setError("Please enter the time allowed.");
      return;
    }

    if (
      !questionTypes.length ||
      questionTypes.some((type) => type.count < 1 || type.marks < 1)
    ) {
      setError("Every question type needs at least one question and one mark.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    setIsGenerating(true);

    try {
      const payload = {
        title: title.trim(),
        subject: subject.trim(),
        classLevel: classLevel.trim(),
        timeAllowed: timeAllowed.trim(),
        dueDate,
        questionTypes: questionTypes.map(qt => ({
          type: qt.type,
          count: Number(qt.count),
          marks: Number(qt.marks),
        })),
        additionalInfo,
        fileName: file?.name,
      };

      const createResponse = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!createResponse.ok) {
        throw new Error("Could not save assignment");
      }

      const { assignment } = await createResponse.json();
      setActiveAssignmentId(assignment._id);

      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: assignment._id,
          ...payload,
        }),
      });

      if (!generateResponse.ok) {
        const err = await generateResponse.json();
        throw new Error(err.error || "Could not start generation");
      }

      const completedAssignment = await waitForCompletion(assignment._id);

      const normalized = {
        ...completedAssignment,
        dueDate: new Date(completedAssignment.dueDate),
        createdAt: new Date(completedAssignment.createdAt),
        updatedAt: new Date(completedAssignment.updatedAt),
      };

      addAssignment(normalized);
      setCurrentAssignment(normalized);
      addNotification(`Assignment "${normalized.title}" generated successfully`);
      router.push(`/assignments/output?id=${normalized._id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while generating."
      );
      setIsGenerating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <GenerationOverlay />
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 hidden lg:block">
          <div className="mb-2 flex items-center gap-3">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">
              Create Assignment
            </h1>
          </div>
          <p className="pl-8 text-sm font-medium text-zinc-500">
            Set up a new assignment for your students
          </p>
        </div>

        <div className="mx-auto mb-8 grid max-w-3xl grid-cols-2 gap-2 px-2 lg:max-w-4xl">
          <div className="h-1.5 rounded-full bg-zinc-700" />
          <div className="h-1.5 rounded-full bg-white/50" />
        </div>

        <div className="mx-auto max-w-4xl rounded-lg border border-white/80 bg-white/50 p-5 shadow-xl shadow-zinc-500/10 backdrop-blur sm:p-8">
          <div className="mb-7">
            <h2 className="text-2xl font-black text-zinc-900">
              Assignment Details
            </h2>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Basic information about your assignment
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-black text-zinc-900">
                Assignment Title
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Quiz on Electricity"
                className="h-12 rounded-full border-zinc-300 bg-white/80 px-5 text-base shadow-none"
              />
            </div>
            <div>
              <label className="mb-3 block text-sm font-black text-zinc-900">
                Subject
              </label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Physics"
                className="h-12 rounded-full border-zinc-300 bg-white/80 px-5 text-base shadow-none"
              />
            </div>
          </div>

          <div className="mt-7">
            <FileUpload 
              onFileSelect={setFile}
              onTextExtracted={(text) => {
                setExtractedText(text);
                updateSourceContent(text);
              }}
            />
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-black text-zinc-900">
                Class / Grade
              </label>
              <Input
                type="text"
                value={classLevel}
                onChange={(e) => {
                  setClassLevel(e.target.value);
                  setError("");
                }}
                placeholder="e.g., Grade 10"
                className="h-12 rounded-full border-zinc-300 bg-white/80 px-5 text-base shadow-none"
              />
            </div>
            <div>
              <label className="mb-3 block text-sm font-black text-zinc-900">
                Time Allowed
              </label>
              <Input
                type="text"
                value={timeAllowed}
                onChange={(e) => {
                  setTimeAllowed(e.target.value);
                  setError("");
                }}
                placeholder="e.g., 2 hours"
                className="h-12 rounded-full border-zinc-300 bg-white/80 px-5 text-base shadow-none"
              />
            </div>
          </div>

          <div className="mt-7">
            <label className="mb-3 block text-sm font-black text-zinc-900">
              Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setError("");
              }}
              className="h-12 rounded-full border-zinc-300 bg-white/80 px-5 text-base shadow-none"
            />
          </div>

          <div className="mt-7">
            <div className="mb-4 hidden grid-cols-[minmax(15rem,1fr)_2rem_7rem_7rem] items-center gap-3 text-sm font-black text-zinc-800 sm:grid">
              <span>Question Type</span>
              <span />
              <span className="text-center">No. of Questions</span>
              <span className="text-center">Marks</span>
            </div>

            <div className="space-y-4 sm:space-y-3">
              {questionTypes.map((qt, index) => (
                <QuestionTypeRow
                  key={`${qt.type}-${index}`}
                  questionType={qt}
                  onUpdate={(updates) => {
                    setError("");
                    updateQuestionType(index, updates);
                  }}
                  onRemove={() => removeQuestionType(index)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowQuestionTypeSelector(!showQuestionTypeSelector)}
              className="mt-5 inline-flex items-center gap-3 rounded-full text-sm font-black text-zinc-900 transition hover:text-orange-600"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-zinc-950 text-white">
                <Plus className="h-6 w-6" />
              </span>
              Add Question Type
            </button>

            {showQuestionTypeSelector && (
              <div className="mt-3 grid gap-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
                <p className="text-sm font-bold text-zinc-900">Select Question Type:</p>
                {questionTypeOptions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addQuestionType(type)}
                    className="rounded-md px-4 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-orange-50 hover:text-orange-600"
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-7 flex flex-col items-end gap-2 text-base font-medium text-zinc-900">
              <p>Total Questions: {totalQuestions}</p>
              <p>Total Marks: {totalMarks}</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-black text-zinc-900">
                Source Content
              </label>
              <span className="text-xs font-semibold text-zinc-500">
                {sourceCharCount}/{MAX_SOURCE_CHARS}
              </span>
            </div>
            {extractedText && (
              <p className="mb-2 text-xs text-emerald-600 font-semibold">
                ✓ Text extracted from file. You can edit or add more details below.
              </p>
            )}
            <div className="relative">
              <textarea
                value={additionalInfo}
                onChange={(event) => updateSourceContent(event.target.value)}
                rows={4}
                maxLength={MAX_SOURCE_CHARS}
                className="min-h-28 w-full resize-none rounded-lg border border-dashed border-zinc-300 bg-white/60 px-5 py-4 pr-14 text-sm font-medium text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-orange-500"
              />
            </div>
          </div>

          {error && (
            <p className="mt-5 rounded-md bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}
        </div>

        <div className="mx-auto mt-8 flex flex-wrap max-w-4xl gap-3 px-1">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none justify-center whitespace-nowrap inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-base font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 min-w-[140px]"
          >
            <ArrowLeft className="h-5 w-5" />
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none justify-center whitespace-nowrap inline-flex h-12 items-center gap-2 rounded-full bg-zinc-950 px-7 text-base font-bold text-white shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-60 min-w-[140px]"
          >
            {isSubmitting ? "Generating..." : "Next"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </>
  );
}
