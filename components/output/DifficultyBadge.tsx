import { QuestionDifficulty } from "@/types";
import { cn } from "@/lib/utils";

type DifficultyBadgeProps = {
  difficulty: QuestionDifficulty;
};

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-1.5 py-0.5 text-xs font-black",
        difficulty === "Easy" && "bg-emerald-50 text-emerald-700",
        difficulty === "Moderate" && "bg-amber-50 text-amber-700",
        difficulty === "Challenging" && "bg-rose-50 text-rose-700"
      )}
    >
      [{difficulty}]
    </span>
  );
}
