import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String, default: "" },
    refId: { type: String, default: "" },
    emailSent: { type: Boolean, default: false },
    emailClaimedAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, refId: 1 }, { unique: true, partialFilterExpression: { refId: { $type: "string", $gt: "" } } });

export const Notification = mongoose.model("Notification", notificationSchema);
