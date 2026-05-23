import { Question } from "@/types";
import { DifficultyBadge } from "./DifficultyBadge";

type QuestionItemProps = {
  question: Question;
};

export function QuestionItem({ question }: QuestionItemProps) {
  const labels = ["(a)", "(b)", "(c)", "(d)", "(e)", "(f)"];

  return (
    <li className="grid grid-cols-[1.5rem_1fr] gap-2 text-sm leading-7 sm:text-base">
      <span className="font-medium">{question.number}.</span>
      <div>
        <DifficultyBadge difficulty={question.difficulty} />
        <span className="ml-2">{question.text}</span>
        <span className="ml-2 whitespace-nowrap text-zinc-700">
          [{question.marks} Marks]
        </span>
        {question.options && question.options.length > 0 && (
          <div className="mt-1.5 space-y-0.5 pl-2 text-zinc-600">
            {question.options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <span className="w-6 shrink-0 font-medium">
                  {labels[i] || `(${i + 1})`}
                </span>
                <span>{opt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
