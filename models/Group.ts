import mongoose, { Schema, models, model } from "mongoose";

const groupSchema = new Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true },
    studentCount: { type: Number, default: 0 },
    description: String,
  },
  { timestamps: true }
);

groupSchema.index({ userId: 1, createdAt: -1 });

export type GroupDocument = mongoose.InferSchemaType<typeof groupSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const GroupModel = models.Group || model("Group", groupSchema);
