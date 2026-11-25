import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    publicId: { type: String, default: "" },
    caption: { type: String, default: "" },
    album: { type: String, default: "Academy" },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const GalleryItem = mongoose.model("GalleryItem", gallerySchema);
