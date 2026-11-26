import mongoose from "mongoose";

const jobOutboxSchema = new mongoose.Schema(
  {
    _id: { type: String },
    eventName: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["pending", "sending", "sent", "expired"], default: "pending", index: true },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    leaseUntil: { type: Date, default: null },
    lastError: { type: String, default: "" },
    sentAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

jobOutboxSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });
jobOutboxSchema.index({ completedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { completedAt: { $type: "date" } } });

export const JobOutbox = mongoose.model("JobOutbox", jobOutboxSchema);
