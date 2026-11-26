import bcrypt from "bcryptjs";
import { cacheAside, cacheDel } from "../../config/redis.js";
import { cacheKeys } from "../../config/cacheKeys.js";
import { CoachProfile, User } from "../../models/index.js";
import { recordAudit } from "../../utils/audit.js";
import { ApiError } from "../../utils/ApiError.js";
import { presentCoach } from "../../utils/presenters.js";
import { sanitizePlain } from "../../utils/sanitize.js";
import { disconnectUserSockets } from "../../sockets/io.js";

const populate = { path: "userId", select: "name email phone status avatar deletedAt" };

export async function listPublicCoaches() {
  return cacheAside(cacheKeys.coaches, 600, async () => {
    const coaches = await CoachProfile.find({ isPublic: true }).populate(populate);
    return coaches
      .filter((coach) => coach.userId && !coach.userId.deletedAt && coach.userId.status === "active")
      .map(presentCoach);
  });
}

export async function listCoaches() {
  const coaches = await CoachProfile.find().populate(populate).sort({ createdAt: -1 });
  return coaches.filter((coach) => coach.userId && !coach.userId.deletedAt).map(presentCoach);
}

export async function createCoach(actor, input) {
  if (await User.findOne({ email: input.email })) throw new ApiError(409, "EMAIL_TAKEN", "An account with that email already exists");
  const user = await User.create({
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, 12),
    role: "coach",
    status: "active",
    emailVerifiedAt: new Date(),
    name: sanitizePlain(input.name),
    phone: input.phone,
  });
  await CoachProfile.create({
    userId: user.id,
    bio: sanitizePlain(input.bio || ""),
    specialization: sanitizePlain(input.specialization || ""),
    experienceYears: input.experienceYears || 0,
    isPublic: input.isPublic !== false,
  });
  await cacheDel(cacheKeys.coaches);
  await recordAudit(actor.id, "coach.create", String(user.id), {});
  const coach = await CoachProfile.findOne({ userId: user.id }).populate(populate);
  return presentCoach(coach);
}

export async function updateCoach(actor, userId, input) {
  const profile = await CoachProfile.findOne({ userId }).populate(populate);
  if (!profile?.userId || profile.userId.deletedAt) throw new ApiError(404, "NOT_FOUND", "Coach not found");
  if (input.name) profile.userId.name = sanitizePlain(input.name);
  if (input.phone) profile.userId.phone = input.phone;
  await profile.userId.save();
  if (input.bio !== undefined) profile.bio = sanitizePlain(input.bio);
  if (input.specialization !== undefined) profile.specialization = sanitizePlain(input.specialization);
  if (input.experienceYears !== undefined) profile.experienceYears = input.experienceYears;
  if (input.isPublic !== undefined) profile.isPublic = input.isPublic;
  await profile.save();
  await cacheDel(cacheKeys.coaches);
  await recordAudit(actor.id, "coach.update", String(userId), {});
  return presentCoach(await CoachProfile.findOne({ userId }).populate(populate));
}

export async function removeCoach(actor, userId) {
  const user = await User.findOne({ _id: userId, role: "coach", deletedAt: null });
  if (!user) throw new ApiError(404, "NOT_FOUND", "Coach not found");
  user.deletedAt = new Date();
  user.status = "suspended";
  user.authVersion = (user.authVersion || 0) + 1;
  await user.save();
  disconnectUserSockets(user.id);
  await cacheDel(cacheKeys.coaches);
  await recordAudit(actor.id, "coach.delete", String(userId), {});
  return { ok: true };
}
