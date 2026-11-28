import mongoose from "mongoose";

const coachSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    bio: { type: String, default: "" },
    specialization: { type: String, default: "" },
    experienceYears: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
  },
  { timestamps: true },
);

export const CoachProfile = mongoose.model("CoachProfile", coachSchema);
