import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "read", "closed"], default: "new", index: true },
  },
  { timestamps: true },
);

export const Enquiry = mongoose.model("Enquiry", enquirySchema);
