import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastReadAt: Date,
    unreadCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

participantSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
participantSchema.index({ userId: 1 });

export const ConversationParticipant = mongoose.model("ConversationParticipant", participantSchema);
