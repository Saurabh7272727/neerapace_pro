import { ApiError } from "../utils/ApiError.js";

const EXEMPT = new Set([
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/verify-otp",
  "/api/auth/resend-otp",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/csrf",
]);

export function csrfProtection(req, _res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const path = req.originalUrl.split("?")[0];
  if (EXEMPT.has(path) || path.startsWith("/api/inngest")) return next();
  const cookie = req.cookies?.np_csrf;
  const header = req.get("x-csrf-token");
  if (!cookie || !header || cookie.length !== header.length || cookie !== header) {
    return next(new ApiError(403, "CSRF", "This request could not be verified. Refresh the page and try again"));
  }
  return next();
}
