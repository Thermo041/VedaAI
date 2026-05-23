import mongoose, { Schema, models, model } from "mongoose";

const schoolSchema = new Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
  },
  { timestamps: true }
);

export const SchoolModel = models.School || model("School", schoolSchema);
