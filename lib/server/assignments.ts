import { Assignment } from "@/types";
import { connectMongo } from "@/lib/db/mongodb";
import { AssignmentModel } from "@/models/Assignment";
import { CreateAssignmentInput } from "@/lib/validation";
import { parseGeneratedPaper } from "@/lib/ai/parser";

function mapDocument(doc: {
  _id: { toString(): string };
  title: string;
  subject?: string;
  userId: string;
  schoolId?: string;
  fileUrl?: string;
  classLevel?: string;
  timeAllowed?: string;
  dueDate: Date;
  questionTypes?: Assignment["questionTypes"];
  additionalInfo?: string;
  totalQuestions?: number;
  totalMarks?: number;
  status: Assignment["status"];
  generatedPaper?: Assignment["generatedPaper"];
  answerKey?: string[];
  createdAt: Date;
  updatedAt: Date;
}): Assignment {
  return {
    _id: doc._id.toString(),
    title: doc.title,
    subject: doc.subject,
    userId: doc.userId,
    schoolId: doc.schoolId || "",
    fileUrl: doc.fileUrl,
    classLevel: doc.classLevel,
    timeAllowed: doc.timeAllowed,
    dueDate: doc.dueDate,
    questionTypes: doc.questionTypes ?? [],
    additionalInfo: doc.additionalInfo,
    totalQuestions: doc.totalQuestions || 0,
    totalMarks: doc.totalMarks || 0,
    status: doc.status,
    generatedPaper: doc.generatedPaper as Assignment["generatedPaper"],
    answerKey: doc.answerKey,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listAssignments(userId: string) {
  await connectMongo();
  const docs = await AssignmentModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50);
  return docs.map(mapDocument);
}

export async function createAssignment(
  userId: string,
  schoolId: string,
  input: CreateAssignmentInput
) {
  const totalQuestions = input.questionTypes.reduce(
    (sum, item) => sum + item.count,
    0
  );
  const totalMarks = input.questionTypes.reduce(
    (sum, item) => sum + item.count * item.marks,
    0
  );

  await connectMongo();
  const doc = await AssignmentModel.create({
    title: input.title,
    subject: input.subject,
    userId,
    schoolId,
    fileUrl: input.fileName,
    classLevel: input.classLevel,
    timeAllowed: input.timeAllowed,
    dueDate: input.dueDate,
    questionTypes: input.questionTypes,
    additionalInfo: input.additionalInfo,
    totalQuestions,
    totalMarks,
    status: "generating",
  });
  return mapDocument(doc);
}

export async function getAssignment(id: string, userId?: string) {
  await connectMongo();
  const query = userId ? { _id: id, userId } : { _id: id };
  const doc = await AssignmentModel.findOne(query);
  if (!doc) return null;
  let generatedPaper = doc.generatedPaper;
  if (generatedPaper) {
    try {
      generatedPaper = parseGeneratedPaper(generatedPaper);
    } catch {
      generatedPaper = doc.generatedPaper;
    }
  }
  return {
    ...mapDocument(doc),
    answerKey: doc.answerKey,
    generatedPaper,
  };
}

export async function updateAssignment(
  id: string,
  data: Partial<Assignment> & { answerKey?: string[] },
  userId?: string
) {
  await connectMongo();
  const query = userId ? { _id: id, userId } : { _id: id };
  const doc = await AssignmentModel.findOneAndUpdate(query, data, {
    returnDocument: "after",
  });
  if (!doc) return null;
  return {
    ...mapDocument(doc),
    answerKey: doc.answerKey,
    generatedPaper: doc.generatedPaper,
  };
}

export async function deleteAssignment(id: string, userId: string) {
  await connectMongo();
  const doc = await AssignmentModel.findOneAndDelete({ _id: id, userId });
  return Boolean(doc);
}
