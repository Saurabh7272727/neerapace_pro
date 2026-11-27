import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    publicId: { type: String, default: "" },
    caption: { type: String, required: true, maxlength: 200 },
    playerName: { type: String, required: true, maxlength: 80 },
    tag: { type: String, default: "", maxlength: 48 },
    country: { type: String, default: "", maxlength: 80 },
    teamName: { type: String, default: "", maxlength: 100 },
    sortOrder: { type: Number, default: 0 },
    slot: { type: Number, required: true, min: 0, max: 4 },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

bannerSchema.index({ slot: 1 }, { unique: true });
bannerSchema.index({ published: 1, sortOrder: 1, createdAt: -1 });

export const Banner = mongoose.model("Banner", bannerSchema);
