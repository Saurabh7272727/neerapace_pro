import crypto from "node:crypto";
import { env } from "../config/env.js";

function key() {
  return crypto.createHash("sha256").update(env.OTP_PEPPER).digest();
}

export function sealOtpPayload(data) {
  if (typeof data.otp !== "string") return data;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(data.otp, "utf8"), cipher.final()]);
  const { otp, ...rest } = data;
  return { ...rest, otpCiphertext: ciphertext.toString("base64"), otpIv: iv.toString("base64"), otpAuthTag: cipher.getAuthTag().toString("base64") };
}

export function openOtpPayload(data) {
  if (!data.otpCiphertext) return data;
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(data.otpIv, "base64"));
  decipher.setAuthTag(Buffer.from(data.otpAuthTag, "base64"));
  const otp = Buffer.concat([decipher.update(Buffer.from(data.otpCiphertext, "base64")), decipher.final()]).toString("utf8");
  const { otpCiphertext, otpIv, otpAuthTag, ...rest } = data;
  return { ...rest, otp };
}
