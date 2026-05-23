"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/layout/PageIntro";
import { useNotificationStore } from "@/stores/useNotificationStore";

type Criterion = {
  id: string;
  name: string;
  excellent: string;
  good: string;
  satisfactory: string;
  needsImprovement: string;
  points: number;
};

export default function RubricBuilderPage() {
  const router = useRouter();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>([
    {
      id: "1",
      name: "",
      excellent: "",
      good: "",
      satisfactory: "",
      needsImprovement: "",
      points: 10,
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const addCriterion = () => {
    setCriteria([
      ...criteria,
      {
        id: Date.now().toString(),
        name: "",
        excellent: "",
        good: "",
        satisfactory: "",
        needsImprovement: "",
        points: 10,
      },
    ]);
  };

  const updateCriterion = (id: string, field: keyof Criterion, value: string | number) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const removeCriterion = (id: string) => {
    if (criteria.length === 1) return;
    setCriteria(criteria.filter((c) => c.id !== id));
  };

  const handleGenerate = async () => {
    if (!title.trim() || !subject.trim()) {
      alert("Please enter title and subject");
      return;
    }

    if (
      criteria.some(
        (c) =>
          !c.name.trim() ||
          !c.excellent.trim() ||
          !c.good.trim() ||
          !c.satisfactory.trim() ||
          !c.needsImprovement.trim() ||
          c.points <= 0
      )
    ) {
      alert("Please complete all criteria fields and points");
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/rubrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          criteria: criteria.map(c => ({
            name: c.name,
            excellent: c.excellent,
            good: c.good,
            satisfactory: c.satisfactory,
            needsImprovement: c.needsImprovement,
            points: c.points,
          })),
          totalPoints,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save rubric");
      }

      addNotification(`Rubric "${title}" created successfully`);
      alert("Rubric saved successfully!");
    } catch (error) {
      alert("Failed to save rubric. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!title.trim()) {
      alert("Please enter a title first");
      return;
    }

    let content = `${title.toUpperCase()}\n`;
    content += `Subject: ${subject}\n`;
    content += `Total Points: ${totalPoints}\n\n`;
    content += `GRADING RUBRIC\n`;
    content += `=`.repeat(80) + `\n\n`;

    criteria.forEach((criterion, index) => {
      content += `${index + 1}. ${criterion.name} (${criterion.points} points)\n`;
      content += `-`.repeat(80) + `\n`;
      content += `Excellent: ${criterion.excellent}\n`;
      content += `Good: ${criterion.good}\n`;
      content += `Satisfactory: ${criterion.satisfactory}\n`;
      content += `Needs Improvement: ${criterion.needsImprovement}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_Rubric.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addNotification(`Rubric "${title}" downloaded`);
  };

  const totalPoints = criteria.reduce((sum, c) => sum + c.points, 0);

  return (
    <section className="mx-auto max-w-6xl">
      <PageIntro
        title="Rubric Builder"
        description="Create detailed marking criteria for your assignments"
      />

      <div className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm">
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-900">
              Rubric Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Essay Grading Rubric"
              className="h-11"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-900">
              Subject *
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., English Literature"
              className="h-11"
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900">Criteria</h3>
          <p className="text-sm font-medium text-zinc-600">Total Points: {totalPoints}</p>
        </div>

        <div className="space-y-4">
          {criteria.map((criterion) => (
            <div key={criterion.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Input
                  value={criterion.name}
                  onChange={(e) => updateCriterion(criterion.id, "name", e.target.value)}
                  placeholder="Criterion name"
                  className="flex-1 bg-white"
                />
                <Input
                  type="number"
                  value={criterion.points}
                  onChange={(e) => updateCriterion(criterion.id, "points", parseInt(e.target.value) || 0)}
                  placeholder="Points"
                  className="w-24 bg-white"
                />
                <button
                  onClick={() => removeCriterion(criterion.id)}
                  className="grid h-10 w-10 place-items-center rounded-full text-zinc-500 hover:bg-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-700">Excellent</label>
                  <Input
                    value={criterion.excellent}
                    onChange={(e) => updateCriterion(criterion.id, "excellent", e.target.value)}
                    placeholder="Description"
                    className="bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-700">Good</label>
                  <Input
                    value={criterion.good}
                    onChange={(e) => updateCriterion(criterion.id, "good", e.target.value)}
                    placeholder="Description"
                    className="bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-700">Satisfactory</label>
                  <Input
                    value={criterion.satisfactory}
                    onChange={(e) => updateCriterion(criterion.id, "satisfactory", e.target.value)}
                    placeholder="Description"
                    className="bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-700">Needs Improvement</label>
                  <Input
                    value={criterion.needsImprovement}
                    onChange={(e) => updateCriterion(criterion.id, "needsImprovement", e.target.value)}
                    placeholder="Description"
                    className="bg-white text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addCriterion}
          className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-zinc-100"
        >
          <Plus className="h-5 w-5" />
          Add Criterion
        </button>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            className="rounded-full border border-orange-500 bg-white px-6 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
          >
            Download
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5" />
            {isGenerating ? "Saving..." : "Save Rubric"}
          </button>
        </div>
      </div>
    </section>
  );
}
