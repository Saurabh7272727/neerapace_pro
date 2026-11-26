import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { formatRegistrationId, LOGIN_STATUSES } from "@neerapace/shared";
import { env } from "../../config/env.js";
import { cacheGetDel, cacheSet } from "../../config/redis.js";
import { publish } from "../../jobs/publish.js";
import { CoachProfile, Counter, Program, StudentProfile, User } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { newCsrfToken } from "../../utils/cookies.js";
import { checkOtp, issueOtp } from "../../utils/otp.js";
import { presentCoach, presentStudent, publicUser } from "../../utils/presenters.js";
import { signAccess, signRefresh, verifyRefresh } from "../../utils/tokens.js";
import { logger } from "../../config/logger.js";
import { sanitizePlain } from "../../utils/sanitize.js";
import { disconnectUserSockets } from "../../sockets/io.js";

const ROUNDS = 12;

async function nextRegistrationId() {
  const year = new Date().getUTCFullYear();
  const counter = await Counter.findOneAndUpdate({ _id: `registration-${year}` }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return formatRegistrationId(year, counter.seq);
}

async function createSession(user) {
  const tokenId = crypto.randomBytes(16).toString("hex");
  const access = signAccess({ sub: String(user.id), role: user.role, ver: user.authVersion ?? 0 });
  const refresh = signRefresh({ sub: String(user.id), jti: tokenId, ver: user.authVersion ?? 0 });
  await cacheSet(`refresh:${tokenId}`, "live", env.REFRESH_TTL_SECONDS);
  return { access, refresh, csrf: newCsrfToken(), user: publicUser(user) };
}

async function queueOtp(user, purpose) {
  const otp = await issueOtp(user.email, purpose);
  const name = purpose === "reset" ? "auth/password-reset.requested" : "auth/otp.requested";
  try {
    await publish(name, {
      idempotencyKey: `${purpose}:${user.email}:${Date.now()}`,
      email: user.email,
      name: user.name,
      otp,
      purpose,
    });
  } catch (error) {
    logger.error("Could not queue OTP email", error.message);
  }
}

export async function register(input) {
  const program = await Program.findOne({ _id: input.programId, isPublished: true });
  if (!program) throw new ApiError(400, "PROGRAM", "Choose a published program");
  const existing = await User.findOne({ email: input.email });
  if (existing) throw new ApiError(409, "EMAIL_TAKEN", "An account with that email already exists");

  const user = await User.create({
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, ROUNDS),
    role: "student",
    status: "pending_email",
    name: sanitizePlain(input.name),
    phone: input.phone,
  });

  try {
    await StudentProfile.create({
      userId: user._id,
      registrationId: await nextRegistrationId(),
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      address: sanitizePlain(input.address),
      guardianName: sanitizePlain(input.guardianName),
      guardianPhone: input.guardianPhone,
      guardianEmail: input.guardianEmail || "",
      programId: program._id,
      admissionStatus: "submitted",
    });
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }

  const profile = await StudentProfile.findOne({ userId: user._id });
  await queueOtp(user, "verify");
  return { email: user.email, registrationId: profile.registrationId, status: user.status };
}

export async function verifyEmail({ email, otp }) {
  await checkOtp(email, "verify", otp);
  const user = await User.findOne({ email, deletedAt: null, role: "student" });
  if (!user) throw new ApiError(400, "OTP_INVALID", "That code is invalid or has expired");
  if (!user.emailVerifiedAt) {
    user.emailVerifiedAt = new Date();
    user.status = "pending_approval";
    await user.save();
    await StudentProfile.updateOne({ userId: user._id, admissionStatus: "submitted" }, { admissionStatus: "under_review" });
    await publish("admission/submitted", {
      idempotencyKey: `admission-submitted:${user.id}`,
      userId: String(user.id),
    });
  }
  return { email: user.email, status: user.status };
}

export async function resendOtp({ email, purpose }) {
  const user = await User.findOne({ email, deletedAt: null });
  if (!user) return { ok: true };
  if (purpose === "verify" && user.emailVerifiedAt) {
    throw new ApiError(400, "ALREADY_VERIFIED", "This email is already verified");
  }
  if (purpose === "reset" && (!user.emailVerifiedAt || user.status === "suspended")) return { ok: true };
  await queueOtp(user, purpose);
  return { ok: true };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email, deletedAt: null }).select("+passwordHash");
  const matches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !matches) throw new ApiError(401, "INVALID_LOGIN", "Email or password is incorrect");
  if (user.status === "pending_email") {
    throw new ApiError(403, "EMAIL_UNVERIFIED", "Verify your email before signing in");
  }
  if (user.status === "suspended") throw new ApiError(403, "SUSPENDED", "This account is suspended");
  if (!LOGIN_STATUSES.includes(user.status)) throw new ApiError(403, "ACCOUNT_BLOCKED", "This account cannot sign in");
  user.lastLoginAt = new Date();
  await user.save();
  return createSession(user);
}

export async function refreshSession(token) {
  let payload;
  try {
    payload = verifyRefresh(token || "");
  } catch {
    throw new ApiError(401, "AUTH_REQUIRED", "Sign in again");
  }
  let user = await User.findOne({ _id: payload.sub, deletedAt: null });
  if (!user || !LOGIN_STATUSES.includes(user.status) || (payload.ver ?? 0) !== (user.authVersion ?? 0)) {
    throw new ApiError(401, "AUTH_REQUIRED", "Sign in again");
  }
  const key = `refresh:${payload.jti}`;
  const state = await cacheGetDel(key);
  if (state !== "live") throw new ApiError(401, "AUTH_REQUIRED", "Sign in again");
  user = await User.findOne({ _id: payload.sub, deletedAt: null });
  if (!user || !LOGIN_STATUSES.includes(user.status) || (payload.ver ?? 0) !== (user.authVersion ?? 0)) {
    throw new ApiError(401, "AUTH_REQUIRED", "Sign in again");
  }
  return createSession(user);
}

export async function logout(token) {
  if (!token) return;
  try {
    const payload = verifyRefresh(token);
    await cacheSet(`refresh:${payload.jti}`, "used", 24 * 3600);
  } catch {
    /* The cookie is cleared even when the refresh token has already expired. */
  }
}

export async function forgotPassword({ email }) {
  const user = await User.findOne({ email, deletedAt: null });
  if (user?.emailVerifiedAt && user.status !== "suspended" && user.status !== "pending_email") {
    try {
      await queueOtp(user, "reset");
    } catch (error) {
      if (error.code !== "OTP_COOLDOWN") throw error;
    }
  }
  return { ok: true };
}

export async function resetPassword({ email, otp, password }) {
  await checkOtp(email, "reset", otp);
  const user = await User.findOne({ email, deletedAt: null }).select("+passwordHash");
  if (!user?.emailVerifiedAt) throw new ApiError(400, "OTP_INVALID", "That code is invalid or has expired");
  user.passwordHash = await bcrypt.hash(password, ROUNDS);
  user.authVersion = (user.authVersion || 0) + 1;
  await user.save();
  disconnectUserSockets(user.id);
  return { ok: true };
}

export async function getSession(userId) {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw new ApiError(401, "AUTH_REQUIRED", "Sign in required");
  let profile = null;
  if (user.role === "student") {
    const student = await StudentProfile.findOne({ userId: user.id }).populate("programId", "name").populate("batchId", "name schedule status");
    profile = student ? presentStudent(student) : null;
  } else if (user.role === "coach") {
    const coach = await CoachProfile.findOne({ userId: user.id }).populate("userId", "name email phone status avatar");
    profile = coach ? presentCoach(coach) : null;
  }
  return { ...publicUser(user), profile };
}

export async function updateProfile(user, input) {
  if (input.name) user.name = sanitizePlain(input.name);
  if (input.phone) user.phone = input.phone;
  if (input.avatarUrl !== undefined) {
    user.avatar = { url: input.avatarUrl || "", publicId: input.avatarPublicId || "" };
  }
  await user.save();

  if (user.role === "student") {
    const profile = await StudentProfile.findOne({ userId: user.id });
    if (profile) {
      if (input.address !== undefined) profile.address = sanitizePlain(input.address);
      if (input.guardianPhone) profile.guardianPhone = input.guardianPhone;
      await profile.save();
    }
  }
  if (user.role === "coach") {
    const profile = await CoachProfile.findOne({ userId: user.id });
    if (profile) {
      if (input.bio !== undefined) profile.bio = sanitizePlain(input.bio);
      if (input.specialization !== undefined) profile.specialization = sanitizePlain(input.specialization);
      if (input.experienceYears !== undefined) profile.experienceYears = input.experienceYears;
      if (input.isPublic !== undefined) profile.isPublic = input.isPublic;
      await profile.save();
    }
  }
  return getSession(user.id);
}

export async function googleSignIn(credential, expectedNonce) {
  if (env.GOOGLE_SSO_ENABLED !== "true" || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new ApiError(503, "SSO_UNAVAILABLE", "Google sign-in is not configured");
  }
  if (typeof credential !== "string" || credential.length > 8192) {
    throw new ApiError(400, "SSO_INVALID", "A valid Google credential is required");
  }

  let ticket;
  try {
    const { OAuth2Client } = await import("google-auth-library");
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, googleRedirectUri());
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw new ApiError(401, "SSO_INVALID", "Google could not verify this sign-in");
  }

  const payload = ticket.getPayload();
  if (!payload?.email_verified || !payload.email) {
    throw new ApiError(401, "SSO_EMAIL_UNVERIFIED", "A verified Google email is required");
  }
  if (expectedNonce && payload.nonce !== expectedNonce) {
    throw new ApiError(401, "SSO_INVALID", "Google could not verify this sign-in request");
  }

  const email = payload.email.trim().toLowerCase();
  const allowedDomains = env.GOOGLE_ALLOWED_EMAIL_DOMAINS
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  if (allowedDomains.length) {
    const domain = email.split("@")[1] || "";
    if (!allowedDomains.includes(domain)) {
      throw new ApiError(403, "SSO_DOMAIN", "This Google account is not allowed");
    }
  }

  const user = await User.findOne({ email, deletedAt: null }).select("+passwordHash");
  if (!user) {
    throw new ApiError(403, "SSO_ACCOUNT_NOT_FOUND", "This Google email is not registered in Neera Pace");
  }
  if (user.status !== "active") {
    throw new ApiError(403, "SSO_ACCOUNT_INACTIVE", "This account is not active yet");
  }

  user.lastLoginAt = new Date();
  await user.save();
  return createSession(user);
}

export function googleRedirectUri() {
  return new URL("/api/auth/google/callback", env.CLIENT_ORIGIN).toString();
}

export async function googleAuthorizationUrl(state, nonce) {
  if (env.GOOGLE_SSO_ENABLED !== "true" || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new ApiError(503, "SSO_UNAVAILABLE", "Google sign-in is not configured");
  }
  const { OAuth2Client } = await import("google-auth-library");
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, googleRedirectUri());
  return client.generateAuthUrl({
    access_type: "online",
    prompt: "select_account",
    response_type: "code",
    scope: ["openid", "email", "profile"],
    state,
    nonce,
  });
}

export async function googleSignInWithCode(code, expectedNonce) {
  if (typeof code !== "string" || code.length > 8192) {
    throw new ApiError(400, "SSO_INVALID", "Google returned an invalid authorization code");
  }
  try {
    const { OAuth2Client } = await import("google-auth-library");
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, googleRedirectUri());
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) throw new Error("Google did not return an ID token");
    return googleSignIn(tokens.id_token, expectedNonce);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "SSO_INVALID", "Google could not complete this sign-in");
  }
}
