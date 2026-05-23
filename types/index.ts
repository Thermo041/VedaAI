export type QuestionType = {
  type: string;
  count: number;
  marks: number;
};

export type QuestionDifficulty = "Easy" | "Moderate" | "Challenging";

export type Question = {
  number: number;
  text: string;
  difficulty: QuestionDifficulty;
  marks: number;
  options?: string[];
  answer?: string;
};

export type QuestionSection = {
  id?: string;
  name: string;
  instruction: string;
  questions: Question[];
};

export type GeneratedPaper = {
  sections: QuestionSection[];
  metadata: {
    subject: string;
    class: string;
    timeAllowed: string;
    maxMarks: number;
  };
};

export type AssignmentStatus = "draft" | "generating" | "completed" | "failed";

export type Assignment = {
  _id: string;
  title: string;
  subject?: string;
  userId: string;
  schoolId: string;
  fileUrl?: string;
  classLevel?: string;
  timeAllowed?: string;
  dueDate: Date;
  questionTypes: QuestionType[];
  additionalInfo?: string;
  totalQuestions: number;
  totalMarks: number;
  status: AssignmentStatus;
  generatedPaper?: GeneratedPaper;
  answerKey?: string[];
  errorMessage?: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  _id: string;
  name: string;
  email: string;
  role: "teacher" | "admin";
  schoolId: string;
  avatar?: string;
  createdAt: Date;
};

export type School = {
  _id: string;
  name: string;
  location: string;
  logo?: string;
  createdAt: Date;
};

export type GenerationProgress = {
  assignmentId: string;
  progress: number;
  message: string;
  status: "queued" | "processing" | "completed" | "failed";
};
