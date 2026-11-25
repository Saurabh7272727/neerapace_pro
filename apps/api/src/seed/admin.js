import bcrypt from "bcryptjs";
import { passwordSchema } from "@neerapace/shared";
import { connectDb } from "../config/db.js";
import { env } from "../config/env.js";
import { connectRedis, closeRedis } from "../config/redis.js";
import { User } from "../models/index.js";
import { ensureContent } from "./content.js";

const email = env.ADMIN_EMAIL.toLowerCase();
const password = env.ADMIN_PASSWORD;

if (!email || !passwordSchema.safeParse(password).success) {
  console.error("Set ADMIN_EMAIL and a strong ADMIN_PASSWORD in the environment.");
  process.exit(1);
}

await connectDb();
await connectRedis();
await ensureContent();

const existing = await User.findOne({ email });
if (existing) {
  console.log("Admin already exists:", email);
} else {
  await User.create({
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "admin",
    status: "active",
    emailVerifiedAt: new Date(),
    name: env.ADMIN_NAME || "Academy Owner",
  });
  console.log("Admin created:", email);
}

await closeRedis();
process.exit(0);
