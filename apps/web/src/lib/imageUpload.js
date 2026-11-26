export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function imageFileError(file) {
  if (!file) return "Choose an image to upload.";
  if (!IMAGE_ACCEPT.split(",").includes(file.type)) return "Choose a JPG, PNG, WebP, or GIF image.";
  if (file.size > MAX_IMAGE_SIZE) return "Images must be 10 MB or smaller.";
  return "";
}
