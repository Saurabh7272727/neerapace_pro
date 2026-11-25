import { cacheDel } from "../../config/redis.js";
import { cacheKeys } from "../../config/cacheKeys.js";
import { publish } from "../../jobs/publish.js";
import { Announcement, Batch, StudentProfile } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { sanitizePlain } from "../../utils/sanitize.js";

function present(item) {
  return {
    id: String(item._id),
    title: item.title,
    body: item.body,
    audience: item.audience,
    batchId: item.batchId ? String(item.batchId) : null,
    publishedAt: item.publishedAt || null,
    createdAt: item.createdAt,
  };
}

export async function listForUser(user) {
  if (user.role === "admin") {
    const items = await Announcement.find().sort({ createdAt: -1 }).lean();
    return items.map(present);
  }
  const or = [{ audience: "all" }];
  if (user.role === "student") {
    const profile = await StudentProfile.findOne({ userId: user.id }).select("batchId");
    or.push({ audience: "students" });
    if (profile?.batchId) or.push({ audience: "batch", batchId: profile.batchId });
  }
  if (user.role === "coach") {
    const batches = await Batch.find({ coachIds: user.id, deletedAt: null }).select("_id");
    or.push({ audience: "coaches" });
    if (batches.length) or.push({ audience: "batch", batchId: { $in: batches.map((batch) => batch._id) } });
  }
  const items = await Announcement.find({ publishedAt: { $ne: null }, $or: or }).sort({ publishedAt: -1 }).lean();
  return items.map(present);
}

async function queue(announcement) {
  await cacheDel(cacheKeys.announcements);
  await publish("announcement/published", {
    idempotencyKey: `announcement:${announcement.id}:${announcement.publishedAt?.getTime?.() || Date.now()}`,
    announcementId: String(announcement.id),
  });
}

export async function createAnnouncement(actor, input) {
  if (input.audience === "batch") {
    const batch = await Batch.findOne({ _id: input.batchId, deletedAt: null });
    if (!batch) throw new ApiError(400, "BATCH", "Choose a batch");
  }
  const announcement = await Announcement.create({
    title: sanitizePlain(input.title),
    body: sanitizePlain(input.body),
    audience: input.audience,
    batchId: input.audience === "batch" ? input.batchId : null,
    authorId: actor.id,
    publishedAt: input.publish ? new Date() : null,
  });
  if (announcement.publishedAt) await queue(announcement);
  return present(announcement);
}

export async function publishAnnouncement(id) {
  const announcement = await Announcement.findById(id);
  if (!announcement) throw new ApiError(404, "NOT_FOUND", "Announcement not found");
  if (!announcement.publishedAt) {
    announcement.publishedAt = new Date();
    await announcement.save();
    await queue(announcement);
  }
  return present(announcement);
}

export async function removeAnnouncement(id) {
  const announcement = await Announcement.findByIdAndDelete(id);
  if (!announcement) throw new ApiError(404, "NOT_FOUND", "Announcement not found");
  await cacheDel(cacheKeys.announcements);
  return { ok: true };
}
