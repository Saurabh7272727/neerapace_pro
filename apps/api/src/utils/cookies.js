import crypto from "node:crypto";
import { env } from "../config/env.js";

function base() {
  return { secure: env.COOKIE_SECURE, sameSite: "lax" };
}

export function setAuthCookies(res, { access, refresh, csrf }) {
  const shared = base();
  res.cookie("np_access", access, { ...shared, httpOnly: true, maxAge: env.ACCESS_TTL_SECONDS * 1000, path: "/" });
  res.cookie("np_refresh", refresh, { ...shared, httpOnly: true, maxAge: env.REFRESH_TTL_SECONDS * 1000, path: "/api/auth" });
  res.cookie("np_csrf", csrf, { ...shared, httpOnly: false, maxAge: env.REFRESH_TTL_SECONDS * 1000, path: "/" });
}

export function clearAuthCookies(res) {
  const shared = base();
  res.clearCookie("np_access", { ...shared, httpOnly: true, path: "/" });
  res.clearCookie("np_refresh", { ...shared, httpOnly: true, path: "/api/auth" });
  res.clearCookie("np_csrf", { ...shared, httpOnly: false, path: "/" });
}

export function newCsrfToken() {
  return crypto.randomBytes(24).toString("hex");
}
