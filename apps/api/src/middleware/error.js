import { ApiError } from "../utils/ApiError.js";
import { logger } from "../config/logger.js";

export function notFound(_req, res) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}

export function errorHandler(err, _req, res, _next) {
  if (err?.code === 11000) {
    res.status(409).json({ error: { code: "DUPLICATE", message: "That record already exists" } });
    return;
  }
  if (err?.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: { code: "UPLOAD_TOO_LARGE", message: "Images must be 10 MB or smaller" } });
      return;
    }
    res.status(400).json({ error: { code: "UPLOAD", message: "The file could not be accepted" } });
    return;
  }
  const status = err.status || 500;
  if (status >= 500) logger.error(err.message || "Unhandled error");
  const message = status >= 500 && !(err instanceof ApiError) ? "Something went wrong" : err.message || "Something went wrong";
  res.status(status).json({
    error: {
      code: typeof err.code === "string" ? err.code : "INTERNAL",
      message,
      details: err.details,
    },
  });
}
