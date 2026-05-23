import mongoose, { Schema, models, model } from "mongoose";

const criterionSchema = new Schema(
  {
    name: { type: String, required: true },
    excellent: { type: String, required: true },
    good: { type: String, required: true },
    satisfactory: { type: String, required: true },
    needsImprovement: { type: String, required: true },
    points: { type: Number, required: true },
  },
  { _id: false }
);

const rubricSchema = new Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true },
    criteria: [criterionSchema],
    totalPoints: { type: Number, required: true },
  },
  { timestamps: true }
);

rubricSchema.index({ userId: 1, createdAt: -1 });

export type RubricDocument = mongoose.InferSchemaType<typeof rubricSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const RubricModel = models.Rubric || model("Rubric", rubricSchema);
