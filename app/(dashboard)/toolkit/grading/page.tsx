"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/layout/PageIntro";
import { useNotificationStore } from "@/stores/useNotificationStore";

export default function GradingHelperPage() {
  const router = useRouter();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [formData, setFormData] = useState({
    assignmentTitle: "",
    totalMarks: "",
    rubric: "",
    studentAnswer: "",
  });
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } | null>(null);

  const handleGrade = async () => {
    if (!formData.assignmentTitle.trim() || !formData.studentAnswer.trim()) {
      alert("Please enter assignment title and student answer");
      return;
    }

    setIsGrading(true);

    try {
      const totalMarks = parseInt(formData.totalMarks) || 100;
      
      // Build AI prompt for grading
      const prompt = `You are an expert teacher grading a student's assignment.

Assignment: ${formData.assignmentTitle}
Total Marks: ${totalMarks}
${formData.rubric ? `\nGrading Rubric:\n${formData.rubric}` : ''}

Student's Answer:
${formData.studentAnswer}

Provide a detailed grading in JSON format:
{
  "score": <number between 0 and ${totalMarks}>,
  "feedback": "<overall feedback paragraph>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}

Be fair, constructive, and specific in your feedback.`;

      // Call Groq API
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are an expert teacher. Always respond with valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid AI response format");
      }
      
      const gradingResult = JSON.parse(jsonMatch[0]);

      setResult({
        score: gradingResult.score,
        feedback: gradingResult.feedback,
        strengths: gradingResult.strengths || [],
        improvements: gradingResult.improvements || [],
      });

      addNotification(`Grading completed for "${formData.assignmentTitle}"`);
    } catch (error) {
      console.error("Grading error:", error);
      alert("Failed to grade. Please try again.");
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl">
      <PageIntro
        title="AI Grading Helper"
        description="Get AI-assisted grading suggestions for student submissions"
      />

      <div className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">
                Assignment Title *
              </label>
              <Input
                value={formData.assignmentTitle}
                onChange={(e) => setFormData({ ...formData, assignmentTitle: e.target.value })}
                placeholder="e.g., Essay on Climate Change"
                className="h-11"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">
                Total Marks
              </label>
              <Input
                type="number"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                placeholder="e.g., 100"
                className="h-11"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-900">
              Grading Rubric (Optional)
            </label>
            <textarea
              value={formData.rubric}
              onChange={(e) => setFormData({ ...formData, rubric: e.target.value })}
              placeholder="Paste your rubric or grading criteria here..."
              rows={4}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-900">
              Student Answer *
            </label>
            <textarea
              value={formData.studentAnswer}
              onChange={(e) => setFormData({ ...formData, studentAnswer: e.target.value })}
              placeholder="Paste the student's answer here..."
              rows={8}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-orange-500"
            />
            <p className="mt-2 text-xs text-zinc-500">
              Or upload a file (PDF, DOCX) - Coming soon
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 sm:flex-none whitespace-nowrap rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGrade}
            disabled={isGrading}
            className="flex-1 sm:flex-none whitespace-nowrap inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50 min-w-[200px]"
          >
            <Sparkles className="h-5 w-5" />
            {isGrading ? "Grading..." : "Grade with AI"}
          </button>
        </div>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">Grading Result</h3>
                <div className="text-3xl font-black text-orange-600">
                  {result.score}/{parseInt(formData.totalMarks) || 100}
                </div>
              </div>
              <p className="text-sm text-zinc-700">{result.feedback}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <h4 className="mb-3 text-sm font-bold text-emerald-600">Strengths</h4>
                <ul className="space-y-2">
                  {result.strengths.map((strength, i) => (
                    <li key={i} className="text-sm text-zinc-700">
                      ✓ {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <h4 className="mb-3 text-sm font-bold text-orange-600">Areas for Improvement</h4>
                <ul className="space-y-2">
                  {result.improvements.map((improvement, i) => (
                    <li key={i} className="text-sm text-zinc-700">
                      → {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const text = `Score: ${result.score}/${parseInt(formData.totalMarks) || 100}\n\nFeedback: ${result.feedback}\n\nStrengths:\n${result.strengths.map(s => `- ${s}`).join('\n')}\n\nAreas for Improvement:\n${result.improvements.map(i => `- ${i}`).join('\n')}`;
                  navigator.clipboard.writeText(text);
                  alert("Feedback copied to clipboard!");
                }}
                className="flex-1 sm:flex-none whitespace-nowrap rounded-full border border-orange-500 bg-white px-6 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-50 min-w-[150px]"
              >
                Copy Feedback
              </button>
              <button
                onClick={() => {
                  const text = `GRADING FEEDBACK\n${'='.repeat(50)}\n\nAssignment: ${formData.assignmentTitle}\nScore: ${result.score}/${parseInt(formData.totalMarks) || 100}\n\nFeedback:\n${result.feedback}\n\nStrengths:\n${result.strengths.map(s => `- ${s}`).join('\n')}\n\nAreas for Improvement:\n${result.improvements.map(i => `- ${i}`).join('\n')}`;
                  const blob = new Blob([text], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${formData.assignmentTitle.replace(/\s+/g, "_")}_Feedback.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  addNotification(`Grading feedback downloaded`);
                }}
                className="flex-1 sm:flex-none whitespace-nowrap rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600 min-w-[200px]"
              >
                Download Feedback
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
