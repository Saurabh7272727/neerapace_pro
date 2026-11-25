import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
    coachIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    schedule: { type: String, required: true },
    capacity: { type: Number, required: true },
    status: { type: String, enum: ["upcoming", "active", "completed"], default: "upcoming", index: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Batch = mongoose.model("Batch", batchSchema);
