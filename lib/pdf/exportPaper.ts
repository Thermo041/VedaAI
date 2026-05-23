import { jsPDF } from "jspdf";
import { GeneratedPaper } from "@/types";

export function downloadPaperPdf(
  paper: GeneratedPaper,
  schoolName: string,
  answerKey: string[]
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;

  const line = (text: string, size = 12, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, 520);
    lines.forEach((row: string) => {
      if (y > 760) {
        doc.addPage();
        y = margin;
      }
      doc.text(row, margin, y);
      y += size + 6;
    });
  };

  line(schoolName, 16, true);
  line(`Subject: ${paper.metadata.subject}`, 12, true);
  line(`Class: ${paper.metadata.class}`, 12, true);
  y += 8;
  line(`Time Allowed: ${paper.metadata.timeAllowed}`);
  line(`Maximum Marks: ${paper.metadata.maxMarks}`);
  y += 10;
  line("Name: _________________________");
  line("Roll Number: __________________");
  line("Section: ______________________");
  y += 12;

  paper.sections.forEach((section) => {
    line(section.name, 13, true);
    line(section.instruction, 11);
    y += 4;
    section.questions.forEach((question) => {
      line(
        `${question.number}. ${question.text} [${question.difficulty}] (${question.marks} marks)`
      );
      if (question.options?.length) {
        const labels = ["(a)", "(b)", "(c)", "(d)", "(e)", "(f)"];
        question.options.forEach((opt, i) => {
          line(`     ${labels[i] || `(${i + 1})`} ${opt}`, 10);
        });
      }
    });
    y += 8;
  });

  line("End of Question Paper", 12, true);
  y += 12;
  line("Answer Key:", 13, true);
  answerKey.forEach((answer, index) => {
    line(`${index + 1}. ${answer}`);
  });

  doc.save("vedaai-question-paper.pdf");
}
