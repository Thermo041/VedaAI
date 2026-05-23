import mongoose, { Schema, models, model } from "mongoose";
import { AssignmentStatus } from "@/types";

const questionTypeSchema = new Schema(
  {
    type: { type: String, required: true },
    count: { type: Number, required: true },
    marks: { type: Number, required: true },
  },
  { _id: false }
);

const questionSchema = new Schema(
  {
    number: Number,
    text: String,
    difficulty: String,
    marks: Number,
    options: [String],
    answer: String,
  },
  { _id: false }
);

const sectionSchema = new Schema(
  {
    id: String,
    name: String,
    instruction: String,
    questions: [questionSchema],
  },
  { _id: false }
);

const generatedPaperSchema = new Schema(
  {
    metadata: {
      subject: String,
      class: String,
      timeAllowed: String,
      maxMarks: Number,
    },
    sections: [sectionSchema],
  },
  { _id: false }
);

const assignmentSchema = new Schema(
  {
    title: { type: String, required: true },
    subject: String,
    userId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true },
    fileUrl: String,
    classLevel: String,
    timeAllowed: String,
    dueDate: { type: Date, required: true },
    questionTypes: [questionTypeSchema],
    additionalInfo: String,
    totalQuestions: Number,
    totalMarks: Number,
    status: {
      type: String,
      enum: ["draft", "generating", "completed", "failed"],
      default: "draft",
    },
    generatedPaper: generatedPaperSchema,
    answerKey: [String],
    errorMessage: String,
  },
  { timestamps: true }
);

assignmentSchema.index({ userId: 1, createdAt: -1 });

export type AssignmentDocument = mongoose.InferSchemaType<typeof assignmentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  status: AssignmentStatus;
};

export const AssignmentModel =
  models.Assignment || model("Assignment", assignmentSchema);
