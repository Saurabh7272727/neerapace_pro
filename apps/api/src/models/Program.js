import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    ageGroup: { type: String, required: true },
    scheduleSummary: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    isPublished: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Program = mongoose.model("Program", programSchema);
