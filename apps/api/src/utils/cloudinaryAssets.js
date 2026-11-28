import { getCloudinary } from "../config/cloudinary.js";
import { ApiError } from "./ApiError.js";

const ASSET_FOLDERS = new Set(["programs", "gallery", "banners"]);

export async function deleteAcademyImage(publicId, folder) {
  if (!publicId) return false;
  if (!ASSET_FOLDERS.has(folder) || !new RegExp(`^neerapace/${folder}/[A-Za-z0-9_-]+$`).test(publicId)) {
    throw new ApiError(400, "IMAGE_ASSET_INVALID", "This image is not an academy-managed asset and cannot be deleted here");
  }

  const cloudinary = getCloudinary();
  if (!cloudinary) throw new ApiError(503, "UPLOADS_UNAVAILABLE", "Cloudinary is not configured, so this image could not be deleted");

  let result;
  try {
    result = await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch {
    throw new ApiError(502, "IMAGE_DELETE_FAILED", "Cloudinary could not delete this image. The record was kept; please retry");
  }
  if (result?.result !== "ok" && result?.result !== "not found") {
    throw new ApiError(502, "IMAGE_DELETE_FAILED", "Cloudinary could not confirm image deletion. The record was kept; please retry");
  }
  return result.result === "ok";
}
