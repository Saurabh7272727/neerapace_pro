import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["direct", "batch"], required: true },
    directKey: { type: String, unique: true, sparse: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", unique: true, sparse: true },
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    title: { type: String, default: "" },
    lastMessageAt: Date,
    lastMessagePreview: { type: String, default: "" },
  },
  { timestamps: true },
);

conversationSchema.index({ participantIds: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
