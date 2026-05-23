"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, RefreshCcw, Sparkles } from "lucide-react";
import { QuestionSection } from "@/components/output/QuestionSection";
import { GenerationOverlay } from "@/components/assignment/GenerationOverlay";
import { useAssignmentStore } from "@/stores/useAssignmentStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGenerationStore } from "@/stores/useGenerationStore";
import { useGenerationSocket, pollJobStatus } from "@/hooks/useGenerationSocket";
import { downloadPaperPdf } from "@/lib/pdf/exportPaper";
import { parseGeneratedPaper } from "@/lib/ai/parser";
import { GeneratedPaper } from "@/types";

function OutputContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("id");
  const user = useAuthStore((state) => state.user);
  const currentAssignment = useAssignmentStore((state) => state.currentAssignment);
  const setCurrentAssignment = useAssignmentStore(
    (state) => state.setCurrentAssignment
  );
  const setIsGenerating = useGenerationStore((state) => state.setIsGenerating);
  const setProgress = useGenerationStore((state) => state.setProgress);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useGenerationSocket(isRegenerating || !paper ? assignmentId : null);

  useEffect(() => {
    if (!assignmentId) {
      setError("Missing assignment id");
      return;
    }

    const loadAssignment = async () => {
      const response = await fetch(`/api/assignments/${assignmentId}`);
      if (!response.ok) {
        setError("Could not load assignment");
        return;
      }
      const data = await response.json();
      const assignment = {
        ...data.assignment,
        dueDate: new Date(data.assignment.dueDate),
        createdAt: new Date(data.assignment.createdAt),
        updatedAt: new Date(data.assignment.updatedAt),
      };
      setCurrentAssignment(assignment);
      if (assignment.generatedPaper) {
        try {
          const normalized = parseGeneratedPaper(assignment.generatedPaper);
          setPaper(normalized);
          setAnswers(Array.isArray(assignment.answerKey) ? assignment.answerKey : []);
        } catch (parseError) {
          console.error("[output] Failed to parse stored paper:", parseError);
          setError("Stored question paper is invalid. Please regenerate.");
        }
      } else if (assignment.status === "generating") {
        setIsGenerating(true);
      }
    };

    loadAssignment();
  }, [assignmentId, setCurrentAssignment, setIsGenerating]);

  useEffect(() => {
    if (!assignmentId || paper) return;

    const poll = async () => {
      for (let i = 0; i < 120; i += 1) {
        const status = await pollJobStatus(assignmentId);
        setProgress({
          assignmentId,
          status: status.status,
          progress: status.progress,
          message: status.message,
        });
        if (status.status === "completed" && status.assignment?.generatedPaper) {
          setCurrentAssignment(status.assignment);
          try {
            const normalized = parseGeneratedPaper(status.assignment.generatedPaper);
            setPaper(normalized);
            setAnswers(Array.isArray(status.assignment.answerKey) ? status.assignment.answerKey : []);
          } catch (parseError) {
            console.error("[output] Failed to parse generated paper:", parseError);
            setError("Question paper is invalid. Please regenerate.");
          }
          setIsGenerating(false);
          return;
        }
        if (status.status === "failed") {
          setError(status.message || "Generation failed");
          setIsGenerating(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      setError("Generation timed out");
      setIsGenerating(false);
    };

    poll();
  }, [assignmentId, paper, setCurrentAssignment, setIsGenerating, setProgress]);

  const maxMarks = currentAssignment?.totalMarks || paper?.metadata.maxMarks || 0;
  const schoolName = mounted && user?.school?.name ? user.school.name : "School";

  const handleRegenerate = async () => {
    if (!assignmentId || !currentAssignment) return;
    setIsRegenerating(true);
    setIsGenerating(true);
    setError("");

    const classLevel =
      currentAssignment.classLevel || paper?.metadata.class || "Not specified";
    const timeAllowed =
      currentAssignment.timeAllowed ||
      paper?.metadata.timeAllowed ||
      "Not specified";
    const subject =
      currentAssignment.subject || paper?.metadata.subject || "Not specified";

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          title: currentAssignment.title,
          subject,
          classLevel,
          timeAllowed,
          dueDate: currentAssignment.dueDate,
          questionTypes: currentAssignment.questionTypes,
          additionalInfo: currentAssignment.additionalInfo,
          fileName: currentAssignment.fileUrl,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to queue regeneration");
      }

      for (let attempt = 0; attempt < 120; attempt += 1) {
        const status = await pollJobStatus(assignmentId);
        setProgress({
          assignmentId,
          status: status.status,
          progress: status.progress,
          message: status.message,
        });
        if (status.status === "completed" && status.assignment) {
          setCurrentAssignment(status.assignment);
          if (status.assignment.generatedPaper) {
            try {
              setPaper(parseGeneratedPaper(status.assignment.generatedPaper));
            } catch (parseErr) {
              console.error("[output] Regeneration parse error:", parseErr);
              setError("Regenerated paper has invalid format. Please try regenerating again.");
              break;
            }
          }
          if (status.assignment.answerKey?.length) {
            setAnswers(status.assignment.answerKey);
          }
          break;
        }
        if (status.status === "failed") {
          throw new Error(status.message || "Regeneration failed");
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (regenError) {
      setError(
        regenError instanceof Error ? regenError.message : "Regeneration failed"
      );
    } finally {
      setIsRegenerating(false);
      setIsGenerating(false);
    }
  };

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-bold text-rose-700">{error}</p>
        {paper && (
          <button
            type="button"
            onClick={() => setError("")}
            className="mt-4 rounded-full bg-zinc-900 px-6 py-2 text-sm font-bold text-white"
          >
            Dismiss & show current paper
          </button>
        )}
      </div>
    );
  }

  if (!paper) {
    return (
      <>
        <GenerationOverlay />
        <p className="py-20 text-center text-lg font-bold text-zinc-700">
          Preparing your question paper...
        </p>
      </>
    );
  }

  return (
    <>
      <GenerationOverlay />
      <section className="mx-auto max-w-6xl">
        <div className="no-print mb-4 rounded-lg bg-zinc-900 p-5 text-white shadow-xl shadow-black/20 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10">
                <Sparkles className="h-5 w-5 text-orange-300" />
              </span>
              <div>
                <p className="max-w-3xl text-base font-bold leading-7 lg:text-lg">
                  {mounted && user?.name
                    ? `${user.name}, here is your customized question paper.`
                    : "Here is your customized question paper."}
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-400">
                  Structured sections, difficulty labels, marks, and answer key.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-100"
                onClick={() => downloadPaperPdf(paper, schoolName, answers)}
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15"
                onClick={handleRegenerate}
                disabled={!assignmentId || isRegenerating}
              >
                <RefreshCcw className="h-4 w-4" />
                Regenerate
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15"
                onClick={() => router.push("/assignments")}
              >
                Back to list
              </button>
            </div>
          </div>
        </div>

        <article className="print-paper rounded-lg border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl shadow-zinc-500/15 sm:p-8 lg:p-12">
          <header className="text-center">
            <h1 className="text-2xl font-black leading-tight sm:text-3xl">
              {schoolName}
            </h1>
            <p className="mt-3 text-lg font-bold">Subject: {paper.metadata.subject}</p>
            <p className="text-lg font-bold">Class: {paper.metadata.class}</p>
          </header>

          <div className="mt-10 flex flex-col gap-3 text-sm font-bold sm:flex-row sm:items-center sm:justify-between sm:text-base">
            <p>Time Allowed: {paper.metadata.timeAllowed}</p>
            <p>Maximum Marks: {maxMarks}</p>
          </div>

          <p className="mt-8 text-sm font-bold sm:text-base">
            All questions are compulsory unless stated otherwise.
          </p>

          <div className="mt-8 max-w-sm space-y-2 text-sm font-bold sm:text-base">
            <p className="flex items-end gap-2">
              Name:
              <span className="h-5 flex-1 border-b border-zinc-900" />
            </p>
            <p className="flex items-end gap-2">
              Roll Number:
              <span className="h-5 flex-1 border-b border-zinc-900" />
            </p>
            <p className="flex items-end gap-2">
              Section:
              <span className="h-5 flex-1 border-b border-zinc-900" />
            </p>
          </div>

          <div className="mt-10">
            {paper.sections.map((section, index) => (
              <QuestionSection
                key={section.id ?? `${section.name}-${index}`}
                section={section}
              />
            ))}
          </div>

          <p className="mt-8 font-black">End of Question Paper</p>

          <section className="mt-12 border-t border-zinc-200 pt-8">
            <h2 className="text-xl font-black">Answer Key:</h2>
            <ol className="mt-5 space-y-4 text-sm leading-7 text-zinc-800 sm:text-base">
              {answers.map((answer, index) => (
                <li
                  key={`${index}-${answer.slice(0, 12)}`}
                  className="grid grid-cols-[1.5rem_1fr] gap-2"
                >
                  <span className="font-bold">{index + 1}.</span>
                  <span>{answer}</span>
                </li>
              ))}
            </ol>
          </section>
        </article>
      </section>
    </>
  );
}

export default function OutputPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-lg font-bold text-zinc-700">
          Loading question paper...
        </div>
      }
    >
      <OutputContent />
    </Suspense>
  );
}
