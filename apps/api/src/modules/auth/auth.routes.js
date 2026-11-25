import { Router } from "express";
import { forgotSchema, loginSchema, profileSchema, registerSchema, resendOtpSchema, resetSchema, verifyOtpSchema } from "@neerapace/shared";
import { env } from "../../config/env.js";
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
  res.json({ data: await auth.resetPassword(req.body) });
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await auth.getSession(req.user.id) });
}));

router.patch("/me", requireAuth, validateBody(profileSchema), asyncHandler(async (req, res) => {
  res.json({ data: await auth.updateProfile(req.user, req.body) });
}));

router.post("/google", sensitiveLimiter("google-login", 8, 15 * 60 * 1000), asyncHandler(async (req, res) => {
  const session = await auth.googleSignIn(req.body?.credential);
  setAuthCookies(res, session);
  res.json({ data: { user: session.user } });
}));

router.get("/google/config", (_req, res) => {
  res.json({
    data: {
      enabled: env.GOOGLE_SSO_ENABLED === "true" && Boolean(env.GOOGLE_CLIENT_ID),
      clientId: env.GOOGLE_SSO_ENABLED === "true" ? env.GOOGLE_CLIENT_ID : "",
    },
  });
});

export default router;
