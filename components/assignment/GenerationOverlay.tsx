"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useGenerationStore } from "@/stores/useGenerationStore";

export function GenerationOverlay() {
  const isGenerating = useGenerationStore((state) => state.isGenerating);
  const progress = useGenerationStore((state) => state.progress);

  if (!isGenerating) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-orange-100 text-orange-600">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-black text-zinc-900">Generating paper</p>
            <p className="text-sm font-medium text-zinc-500">
              {progress?.message || "AI is structuring your question paper"}
            </p>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${progress?.progress ?? 12}%` }}
          />
        </div>

        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          {progress?.progress ?? 12}% complete
        </p>
      </div>
    </div>
  );
}
