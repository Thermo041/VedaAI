import { z } from "zod";

export const questionTypeSchema = z.object({
  type: z.string().min(1, "Question type is required"),
  count: z.number().int().positive("Count must be positive"),
  marks: z.number().int().positive("Marks must be positive"),
});

export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  classLevel: z.string().min(1, "Class is required"),
  timeAllowed: z.string().min(1, "Time allowed is required"),
  dueDate: z.coerce.date(),
  questionTypes: z.array(questionTypeSchema).min(1),
  additionalInfo: z.string().optional(),
  fileName: z.string().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const generationAssignmentSchema = createAssignmentSchema.partial({
  subject: true,
  classLevel: true,
  timeAllowed: true,
});

export type GenerationAssignmentInput = z.infer<typeof generationAssignmentSchema>;
