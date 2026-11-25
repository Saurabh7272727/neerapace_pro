import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "coach", "student"], required: true, index: true },
    status: {
      type: String,
      enum: ["pending_email", "pending_approval", "active", "rejected", "suspended"],
      required: true,
      index: true,
    },
    emailVerifiedAt: Date,
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    avatar: {
      publicId: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    lastLoginAt: Date,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, status: 1 });

export const User = mongoose.model("User", userSchema);
