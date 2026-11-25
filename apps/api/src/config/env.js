import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../../../.env") });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/neerapace"),
  REDIS_URL: z.string().optional().default(""),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  OTP_PEPPER: z.string().min(16).optional(),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().default("Neera Pace <admissions@example.com>"),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  INNGEST_EVENT_KEY: z.string().optional().default(""),
  INNGEST_SIGNING_KEY: z.string().optional().default(""),
  ADMIN_NAME: z.string().optional().default("Academy Owner"),
  ADMIN_EMAIL: z.string().optional().default(""),
  ADMIN_PASSWORD: z.string().optional().default(""),
  GOOGLE_CLIENT_ID: z.string().trim().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().trim().optional().default(""),
  GOOGLE_ALLOWED_EMAIL_DOMAINS: z.string().trim().optional().default(""),
  GOOGLE_SSO_ENABLED: z.enum(["true", "false"]).optional().default("false"),
});

export function ttlToSeconds(value, fallback) {
  const match = /^(\d+)([smhd])$/.exec(value || "");
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = { s: 1, m: 60, h: 3600, d: 86400 }[match[2]];
  return amount * unit;
}

const parsed = schema.parse(process.env);

export const env = {
  ...parsed,
  OTP_PEPPER: parsed.OTP_PEPPER || parsed.JWT_ACCESS_SECRET,
  COOKIE_SECURE: parsed.COOKIE_SECURE === "true" || (parsed.COOKIE_SECURE !== "false" && parsed.NODE_ENV === "production"),
  ACCESS_TTL_SECONDS: ttlToSeconds(parsed.JWT_ACCESS_TTL, 15 * 60),
  REFRESH_TTL_SECONDS: ttlToSeconds(parsed.JWT_REFRESH_TTL, 7 * 24 * 3600),
};
