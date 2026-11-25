import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ["present", "absent", "leave"], required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

attendanceSchema.index({ batchId: 1, studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ studentId: 1, date: 1 });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
