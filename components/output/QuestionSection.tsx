import { QuestionSection as QuestionSectionType } from "@/types";
import { QuestionItem } from "./QuestionItem";

type QuestionSectionProps = {
  section: QuestionSectionType;
};

export function QuestionSection({ section }: QuestionSectionProps) {
  return (
    <section className="mb-10">
      <h3 className="mb-7 text-center text-2xl font-black">{section.name}</h3>
      
      <div className="mb-6">
        <p className="font-black">{section.instruction}</p>
      </div>

      <ol className="space-y-4">
        {section.questions.map((question) => (
          <QuestionItem key={question.number} question={question} />
        ))}
      </ol>
    </section>
  );
}
