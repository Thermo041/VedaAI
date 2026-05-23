"use client";

import { QuestionType } from "@/types";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type QuestionTypeRowProps = {
  questionType: QuestionType;
  onUpdate: (updates: Partial<QuestionType>) => void;
  onRemove: () => void;
};

export function QuestionTypeRow({ questionType, onUpdate, onRemove }: QuestionTypeRowProps) {
  const stepperClass =
    "grid h-9 w-9 place-items-center rounded-full text-zinc-500 transition hover:bg-white hover:text-zinc-950";

  return (
    <div className="grid gap-3 rounded-lg bg-white p-3 shadow-sm sm:grid-cols-[minmax(15rem,1fr)_2rem_7rem_7rem] sm:items-center sm:bg-transparent sm:p-0 sm:shadow-none">
      <div className="relative">
        <select
          value={questionType.type}
          onChange={(e) => onUpdate({ type: e.target.value })}
          className="h-12 w-full appearance-none rounded-full border-0 bg-white px-5 pr-10 text-sm font-medium text-zinc-900 shadow-sm outline-none ring-1 ring-transparent transition focus:ring-orange-500"
        >
          <option value="Multiple Choice Questions">Multiple Choice Questions</option>
          <option value="Short Questions">Short Questions</option>
          <option value="Diagram/Graph-Based Questions">Diagram/Graph-Based Questions</option>
          <option value="Numerical Problems">Numerical Problems</option>
          <option value="Long Answer Questions">Long Answer Questions</option>
          <option value="True/False">True/False</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-800" />
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="hidden h-10 w-10 place-items-center rounded-full text-zinc-600 transition hover:bg-white sm:grid"
        aria-label={`Remove ${questionType.type}`}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="grid grid-cols-2 gap-3 sm:contents">
        <div className="rounded-lg bg-zinc-100 p-2 sm:bg-white sm:p-0">
          <span className="mb-1 block text-center text-xs font-bold text-zinc-600 sm:hidden">
            No. of Questions
          </span>
          <div className="flex h-12 items-center justify-between rounded-full bg-white px-2 shadow-sm">
            <button
            type="button"
            className={stepperClass}
            onClick={() => onUpdate({ count: Math.max(1, questionType.count - 1) })}
            aria-label="Decrease question count"
          >
            <Minus className="h-3 w-3" />
            </button>
            <span className="w-7 text-center text-base font-black text-zinc-900">
              {questionType.count}
            </span>
            <button
            type="button"
            className={stepperClass}
            onClick={() => onUpdate({ count: questionType.count + 1 })}
            aria-label="Increase question count"
          >
            <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-zinc-100 p-2 sm:bg-white sm:p-0">
          <span className="mb-1 block text-center text-xs font-bold text-zinc-600 sm:hidden">
            Marks
          </span>
          <div className="flex h-12 items-center justify-between rounded-full bg-white px-2 shadow-sm">
            <button
            type="button"
            className={cn(stepperClass)}
            onClick={() => onUpdate({ marks: Math.max(1, questionType.marks - 1) })}
            aria-label="Decrease marks"
          >
            <Minus className="h-3 w-3" />
            </button>
            <span className="w-7 text-center text-base font-black text-zinc-900">
              {questionType.marks}
            </span>
            <button
            type="button"
            className={stepperClass}
            onClick={() => onUpdate({ marks: questionType.marks + 1 })}
            aria-label="Increase marks"
          >
            <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 sm:hidden"
      >
        <X className="h-4 w-4" />
        Remove type
      </button>
    </div>
  );
}
