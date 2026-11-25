import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    registrationId: { type: String, required: true, unique: true },
    dateOfBirth: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    address: { type: String, default: "" },
    guardianName: { type: String, required: true },
    guardianPhone: { type: String, required: true },
    guardianEmail: { type: String, default: "" },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
    admissionStatus: {
      type: String,
      enum: ["submitted", "under_review", "approved", "rejected"],
      default: "submitted",
      index: true,
    },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", default: null, index: true },
    reviewNote: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const StudentProfile = mongoose.model("StudentProfile", studentSchema);
