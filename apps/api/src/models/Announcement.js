import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    audience: { type: String, enum: ["all", "students", "coaches", "batch"], required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", default: null },
    publishedAt: Date,
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

announcementSchema.index({ publishedAt: -1 });

export const Announcement = mongoose.model("Announcement", announcementSchema);
