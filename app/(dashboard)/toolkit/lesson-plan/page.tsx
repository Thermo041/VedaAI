"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/layout/PageIntro";
import { useNotificationStore } from "@/stores/useNotificationStore";

export default function LessonPlanPage() {
  const router = useRouter();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [formData, setFormData] = useState({
    topic: "",
    subject: "",
    grade: "",
    duration: "",
    objectives: "",
    resources: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState("");

  const handleGenerate = async () => {
    if (!formData.topic.trim() || !formData.subject.trim()) {
      alert("Please enter topic and subject");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(
          errorPayload?.error || "Failed to generate lesson plan"
        );
      }

      const data = await response.json();
      setGeneratedPlan(data.plan);
      addNotification(`Lesson plan for "${formData.topic}" generated successfully`);
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate lesson plan. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl">
      <PageIntro
        title="Lesson Plan Assistant"
        description="Generate structured lesson plans aligned to your curriculum"
      />

      <div className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">
                Topic *
              </label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Photosynthesis"
                className="h-11"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">
                Subject *
              </label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Biology"
                className="h-11"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">
                Grade Level
              </label>
              <Input
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder="e.g., Grade 10"
                className="h-11"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">
                Duration
              </label>
              <Input
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 45 minutes"
                className="h-11"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-900">
              Learning Objectives
            </label>
            <textarea
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              placeholder="What should students learn? (optional)"
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-900">
              Resources Available
            </label>
            <textarea
              value={formData.resources}
              onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
              placeholder="List available resources (optional)"
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.back()}
            className="w-full sm:flex-1 rounded-full border border-zinc-300 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5" />
            {isGenerating ? "Generating..." : "Generate Lesson Plan"}
          </button>
        </div>

        {generatedPlan && (
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-6">
            <h3 className="mb-4 text-lg font-bold text-zinc-900">Generated Lesson Plan</h3>
            <pre className="whitespace-pre-wrap text-sm text-zinc-700">{generatedPlan}</pre>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedPlan);
                  alert("Copied to clipboard!");
                }}
                className="w-full sm:flex-1 rounded-full border border-orange-500 bg-white px-6 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([generatedPlan], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${formData.topic.replace(/\s+/g, "_")}_Lesson_Plan.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  addNotification(`Lesson plan downloaded`);
                }}
                className="w-full sm:flex-1 rounded-full bg-orange-500 px-6 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
