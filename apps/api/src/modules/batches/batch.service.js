import { cacheDel } from "../../config/redis.js";
import { cacheKeys } from "../../config/cacheKeys.js";
import { Batch, Program, StudentProfile, User } from "../../models/index.js";
import { recordAudit } from "../../utils/audit.js";
import { ApiError } from "../../utils/ApiError.js";
import { presentBatch } from "../../utils/presenters.js";
import { sanitizePlain } from "../../utils/sanitize.js";
import { syncBatchConversation } from "../chat/chat.service.js";
import { deleteAcademyImage } from "../../utils/cloudinaryAssets.js";

async function withCounts(batches) {
  const ids = batches.map((batch) => batch._id ?? batch.id);
  const counts = await StudentProfile.aggregate([
    { $match: { batchId: { $in: ids } } },
    { $group: { _id: "$batchId", count: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((row) => [String(row._id), row.count]));
  return batches.map((batch) => presentBatch(batch, map.get(String(batch._id ?? batch.id)) || 0));
}

export async function listBatches(actor) {
  let filter = { deletedAt: null };
  if (actor.role === "coach") filter = { ...filter, coachIds: actor.id };
  if (actor.role === "student") {
    const profile = await StudentProfile.findOne({ userId: actor.id }).select("batchId");
    filter = { ...filter, _id: profile?.batchId || null };
  }
  const batches = await Batch.find(filter).populate("programId", "name").populate("coachIds", "name").sort({ startDate: -1 });
  return withCounts(batches);
}

export async function createBatch(actor, input) {
  const program = await Program.findById(input.programId);
  if (!program) throw new ApiError(400, "PROGRAM", "Choose a program");
  const batch = await Batch.create({ ...input, name: sanitizePlain(input.name), schedule: sanitizePlain(input.schedule), coachIds: [] });
  await syncBatchConversation(batch.id);
  await cacheDel(cacheKeys.stats);
  await recordAudit(actor.id, "batch.create", String(batch.id), {});
  const fresh = await Batch.findById(batch.id).populate("programId", "name").populate("coachIds", "name");
  return (await withCounts([fresh]))[0];
}

export async function updateBatch(actor, id, input) {
  const previousBatch = await Batch.findOne({ _id: id, deletedAt: null });
  if (!previousBatch) throw new ApiError(404, "NOT_FOUND", "Batch not found");
  const batch = await Batch.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { ...input, name: sanitizePlain(input.name), schedule: sanitizePlain(input.schedule) },
    { new: true },
  ).populate("programId", "name").populate("coachIds", "name");
  if (!batch) throw new ApiError(404, "NOT_FOUND", "Batch not found");
  if (previousBatch.imagePublicId && previousBatch.imagePublicId !== batch.imagePublicId) {
    await deleteAcademyImage(previousBatch.imagePublicId, "batches");
  }
  await syncBatchConversation(batch.id);
  await cacheDel(cacheKeys.stats);
  await recordAudit(actor.id, "batch.update", String(id), {});
  return (await withCounts([batch]))[0];
}

export async function removeBatch(actor, id) {
  const batch = await Batch.findOne({ _id: id, deletedAt: null });
  if (!batch) throw new ApiError(404, "NOT_FOUND", "Batch not found");
  batch.deletedAt = new Date();
  if (batch.imagePublicId) await deleteAcademyImage(batch.imagePublicId, "batches");
  await batch.save();
  await StudentProfile.updateMany({ batchId: batch.id }, { batchId: null });
  await syncBatchConversation(batch.id);
  await cacheDel(cacheKeys.stats);
  await recordAudit(actor.id, "batch.delete", String(id), {});
  return { ok: true };
}

export async function assignCoach(actor, batchId, userId) {
  const [batch, coach] = await Promise.all([
    Batch.findOne({ _id: batchId, deletedAt: null }),
    User.findOne({ _id: userId, role: "coach", status: "active", deletedAt: null }),
  ]);
  if (!batch) throw new ApiError(404, "NOT_FOUND", "Batch not found");
  if (!coach) throw new ApiError(400, "COACH", "Choose an active coach");
  const ids = new Set(batch.coachIds.map(String));
  ids.add(String(coach.id));
  batch.coachIds = [...ids];
  await batch.save();
  await syncBatchConversation(batch.id);
  await recordAudit(actor.id, "batch.assignCoach", String(batch.id), { userId: String(userId) });
  return { ok: true };
}

export async function removeCoachFromBatch(actor, batchId, userId) {
  const batch = await Batch.findOne({ _id: batchId, deletedAt: null });
  if (!batch) throw new ApiError(404, "NOT_FOUND", "Batch not found");
  batch.coachIds = batch.coachIds.filter((id) => String(id) !== String(userId));
  await batch.save();
  await syncBatchConversation(batch.id);
  await recordAudit(actor.id, "batch.removeCoach", String(batch.id), { userId: String(userId) });
  return { ok: true };
}

export async function assignStudent(actor, batchId, userId) {
  const batch = await Batch.findOne({ _id: batchId, deletedAt: null });
  const profile = await StudentProfile.findOne({ userId, admissionStatus: "approved" });
  if (!batch) throw new ApiError(404, "NOT_FOUND", "Batch not found");
  if (!profile) throw new ApiError(400, "STUDENT", "Only approved students can join a batch");
  const count = await StudentProfile.countDocuments({ batchId: batch.id });
  const alreadyThere = String(profile.batchId || "") === String(batch.id);
  if (!alreadyThere && count >= batch.capacity) throw new ApiError(400, "CAPACITY", "This batch is full");
  const previous = profile.batchId;
  profile.batchId = batch.id;
  await profile.save();
  if (previous && String(previous) !== String(batch.id)) await syncBatchConversation(previous);
  await syncBatchConversation(batch.id);
  await cacheDel(cacheKeys.stats);
  await recordAudit(actor.id, "batch.assignStudent", String(batch.id), { userId: String(userId) });
  return { ok: true };
}

export async function removeStudentFromBatch(actor, batchId, userId) {
  const profile = await StudentProfile.findOne({ userId, batchId });
  if (!profile) throw new ApiError(404, "NOT_FOUND", "That student is not in this batch");
  profile.batchId = null;
  await profile.save();
  await syncBatchConversation(batchId);
  await cacheDel(cacheKeys.stats);
  await recordAudit(actor.id, "batch.removeStudent", String(batchId), { userId: String(userId) });
  return { ok: true };
}

export async function assignStudents(actor, batchId, userIds) {
  const batch = await Batch.findOne({ _id: batchId, deletedAt: null });
  if (!batch) throw new ApiError(404, "NOT_FOUND", "Batch not found");
  const uniqueUserIds = [...new Set(userIds.map(String))];
  const profiles = await StudentProfile.find({
    userId: { $in: uniqueUserIds },
    admissionStatus: "approved",
  }).select("userId batchId");
  if (profiles.length !== uniqueUserIds.length) {
    throw new ApiError(400, "STUDENT", "One or more selected players are no longer eligible for a batch");
  }
  const newProfiles = profiles.filter((profile) => String(profile.batchId || "") !== String(batch.id));
  const currentCount = await StudentProfile.countDocuments({ batchId: batch.id });
  if (currentCount + newProfiles.length > batch.capacity) {
    throw new ApiError(400, "CAPACITY", `Only ${Math.max(0, batch.capacity - currentCount)} places remain in this batch`);
  }
  const previousBatchIds = [...new Set(newProfiles.map((profile) => String(profile.batchId || "")).filter(Boolean))];
  await StudentProfile.updateMany(
    { userId: { $in: newProfiles.map((profile) => profile.userId) }, admissionStatus: "approved" },
    { batchId: batch.id },
  );
  for (const previousBatchId of previousBatchIds) await syncBatchConversation(previousBatchId);
  await syncBatchConversation(batch.id);
  await cacheDel(cacheKeys.stats);
  await recordAudit(actor.id, "batch.assignStudents", String(batch.id), { count: newProfiles.length });
  return { assigned: newProfiles.length, studentCount: currentCount + newProfiles.length };
}
