import crypto from "node:crypto";
import { Router } from "express";
import { forgotSchema, loginSchema, profileSchema, registerSchema, resendOtpSchema, resetSchema, verifyOtpSchema } from "@neerapace/shared";
import { env } from "../../config/env.js";
import { cacheGetDel, cacheSet } from "../../config/redis.js";
import { requireAuth } from "../../middleware/auth.js";
import { sensitiveLimiter } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { clearAuthCookies, newCsrfToken, setAuthCookies } from "../../utils/cookies.js";
import * as auth from "./auth.service.js";

const router = Router();
const loginLimit = sensitiveLimiter("login", 10, 15 * 60 * 1000);
const otpLimit = sensitiveLimiter("otp", 5, 15 * 60 * 1000);
const registerLimit = sensitiveLimiter("register", 8, 60 * 60 * 1000);
const googleStartLimit = sensitiveLimiter("google-start", 20, 15 * 60 * 1000);
const GOOGLE_STATE_TTL_SECONDS = 10 * 60;
const GOOGLE_STATE_COOKIE = "np_google_state";

function clearGoogleStateCookie(res) {
  res.clearCookie(GOOGLE_STATE_COOKIE, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/api/auth/google",
  });
}

function googleLoginError(res, code) {
  const target = new URL("/login", env.CLIENT_ORIGIN);
  target.searchParams.set("google_error", code);
  return res.redirect(target.toString());
}

router.get("/csrf", (req, res) => {
  const token = req.cookies?.np_csrf || newCsrfToken();
  res.cookie("np_csrf", token, {
    httpOnly: false,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: env.REFRESH_TTL_SECONDS * 1000,
  });
  res.json({ data: { csrfToken: token } });
});

router.post("/register", registerLimit, validateBody(registerSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await auth.register(req.body) });
}));

router.post("/verify-otp", otpLimit, validateBody(verifyOtpSchema), asyncHandler(async (req, res) => {
  res.json({ data: await auth.verifyEmail(req.body) });
}));

router.post("/resend-otp", otpLimit, validateBody(resendOtpSchema), asyncHandler(async (req, res) => {
  res.json({ data: await auth.resendOtp(req.body) });
}));

router.post("/login", loginLimit, validateBody(loginSchema), asyncHandler(async (req, res) => {
  const session = await auth.login(req.body);
  setAuthCookies(res, session);
  res.json({ data: { user: session.user } });
}));

router.post("/refresh", asyncHandler(async (req, res) => {
  const session = await auth.refreshSession(req.cookies?.np_refresh);
  setAuthCookies(res, session);
  res.json({ data: { user: session.user } });
}));

router.post("/logout", asyncHandler(async (req, res) => {
  await auth.logout(req.cookies?.np_refresh);
  clearAuthCookies(res);
  res.json({ data: { ok: true } });
}));

router.post("/forgot-password", otpLimit, validateBody(forgotSchema), asyncHandler(async (req, res) => {
  res.json({ data: await auth.forgotPassword(req.body) });
}));

router.post("/reset-password", otpLimit, validateBody(resetSchema), asyncHandler(async (req, res) => {
  const result = await auth.resetPassword(req.body);
  clearAuthCookies(res);
  res.json({ data: result });
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await auth.getSession(req.user.id) });
}));

router.patch("/me", requireAuth, validateBody(profileSchema), asyncHandler(async (req, res) => {
  res.json({ data: await auth.updateProfile(req.user, req.body) });
}));

router.get("/google/start", googleStartLimit, asyncHandler(async (_req, res) => {
  const state = crypto.randomBytes(32).toString("base64url");
  const nonce = crypto.randomBytes(32).toString("base64url");
  const authorizationUrl = await auth.googleAuthorizationUrl(state, nonce);
  await cacheSet(`oauth:google:${state}`, nonce, GOOGLE_STATE_TTL_SECONDS);
  res.cookie(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: GOOGLE_STATE_TTL_SECONDS * 1000,
  });
  res.redirect(authorizationUrl);
}));

router.get("/google/callback", asyncHandler(async (req, res) => {
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const cookieState = req.cookies?.[GOOGLE_STATE_COOKIE] || "";
  clearGoogleStateCookie(res);

  if (!state || !cookieState || state !== cookieState) {
    return googleLoginError(res, "state");
  }
  const nonce = await cacheGetDel(`oauth:google:${state}`);
  if (typeof nonce !== "string" || !nonce) return googleLoginError(res, "state");
  if (req.query.error) return googleLoginError(res, req.query.error === "access_denied" ? "cancelled" : "failed");
  if (typeof req.query.code !== "string") return googleLoginError(res, "failed");

  try {
    const session = await auth.googleSignInWithCode(req.query.code, nonce);
    setAuthCookies(res, session);
    const destination = session.user.role === "admin"
      ? "/app/admin"
      : session.user.role === "coach"
        ? "/app/coach"
        : "/app/student";
    return res.redirect(new URL(destination, env.CLIENT_ORIGIN).toString());
  } catch (error) {
    const publicErrorCodes = new Set([
      "SSO_ACCOUNT_NOT_FOUND",
      "SSO_ACCOUNT_INACTIVE",
      "SSO_DOMAIN",
      "SSO_EMAIL_UNVERIFIED",
    ]);
    return googleLoginError(res, publicErrorCodes.has(error?.code) ? error.code : "failed");
  }
}));

router.get("/google/config", (_req, res) => {
  const enabled = env.GOOGLE_SSO_ENABLED === "true" && Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  res.json({
    data: {
      enabled,
      clientId: enabled ? env.GOOGLE_CLIENT_ID : "",
    },
  });
});

export default router;
