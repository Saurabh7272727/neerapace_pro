import crypto from "node:crypto";
import { OTP_COOLDOWN_SECONDS, OTP_MAX_ATTEMPTS, OTP_TTL_SECONDS } from "@neerapace/shared";
import { env } from "../config/env.js";
import { cacheDel, cacheGet, cacheSet, getJson, putJson } from "../config/redis.js";
import { ApiError } from "./ApiError.js";

export function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(otp) {
  return crypto.createHmac("sha256", env.OTP_PEPPER).update(String(otp)).digest("hex");
}

export function otpMatches(otp, hash) {
  const next = hashOtp(otp);
  const left = Buffer.from(next);
  const right = Buffer.from(String(hash));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function otpKey(purpose, email) {
  return `otp:${purpose}:${email}`;
}

export async function issueOtp(email, purpose) {
  const cooldownKey = `otp:cooldown:${purpose}:${email}`;
  if (await cacheGet(cooldownKey)) {
    throw new ApiError(429, "OTP_COOLDOWN", "Please wait before requesting another code");
  }
  const otp = generateOtp();
  await putJson(otpKey(purpose, email), { hash: hashOtp(otp), attempts: 0 }, OTP_TTL_SECONDS);
  await cacheSet(cooldownKey, "1", OTP_COOLDOWN_SECONDS);
  return otp;
}

export async function checkOtp(email, purpose, otp) {
  const key = otpKey(purpose, email);
  const record = await getJson(key);
  if (!record) throw new ApiError(400, "OTP_INVALID", "That code is invalid or has expired");
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, "OTP_LOCKED", "Too many attempts. Request a new code");
  }
  if (!otpMatches(otp, record.hash)) {
    record.attempts += 1;
    await putJson(key, record, OTP_TTL_SECONDS);
    throw new ApiError(400, "OTP_INVALID", "That code is invalid or has expired");
  }
  await cacheDel(key);
  return true;
}
