import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    heroTitle: { type: String, default: "" },
    heroSubtitle: { type: String, default: "" },
    bodyHtml: { type: String, default: "" },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Page = mongoose.model("Page", pageSchema);
