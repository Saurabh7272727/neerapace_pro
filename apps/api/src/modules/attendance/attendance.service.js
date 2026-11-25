import { todayUtc } from "@neerapace/shared";
import { cacheDel } from "../../config/redis.js";
import { cacheKeys } from "../../config/cacheKeys.js";
import { Attendance, Batch, StudentProfile, User } from "../../models/index.js";
import { recordAudit } from "../../utils/audit.js";
import { ApiError } from "../../utils/ApiError.js";
import { canViewBatchAttendance } from "../chat/permissions.js";

async function assertBatchVisible(actor, batchId) {
  const batch = await Batch.findOne({ _id: batchId, deletedAt: null });
  if (!batch) throw new ApiError(404, "NOT_FOUND", "Batch not found");
  if (actor.role === "admin") return batch;
  if (actor.role === "coach" && batch.coachIds.some((id) => String(id) === String(actor.id))) return batch;
  if (actor.role === "student") {
    const profile = await StudentProfile.findOne({ userId: actor.id, batchId: batch.id });
    if (profile) return batch;
  }
  throw new ApiError(403, "FORBIDDEN", "You do not have access to this batch");
}

export async function markAttendance(actor, input) {
  const batch = await assertBatchVisible(actor, input.batchId);
  if (actor.role !== "admin") throw new ApiError(403, "FORBIDDEN", "Only an admin can mark attendance");
  const profiles = await StudentProfile.find({ batchId: batch.id, userId: { $in: input.records.map((row) => row.studentId) } }).select("userId");
  const allowed = new Set(profiles.map((profile) => String(profile.userId)));
  if (allowed.size !== new Set(input.records.map((row) => row.studentId)).size) {
    throw new ApiError(400, "STUDENTS", "Every attendance row must belong to a student in this batch");
  }
  await Attendance.bulkWrite(
    input.records.map((row) => ({
      updateOne: {
        filter: { batchId: batch.id, studentId: row.studentId, date: input.date },
        update: { $set: { status: row.status, markedBy: actor.id } },
        upsert: true,
      },
    })),
  );
  await cacheDel(cacheKeys.stats);
  await recordAudit(actor.id, "attendance.mark", String(batch.id), { date: input.date, count: input.records.length });
  return listAttendance(actor, { batchId: String(batch.id), date: input.date });
}

export async function listAttendance(actor, query) {
  const filter = {};
  if (actor.role === "student") {
    filter.studentId = actor.id;
  } else if (query.batchId) {
    await assertBatchVisible(actor, query.batchId);
    filter.batchId = query.batchId;
  } else if (actor.role === "coach") {
    const batches = await Batch.find({ coachIds: actor.id, deletedAt: null }).select("_id");
    filter.batchId = { $in: batches.map((batch) => batch.id) };
  }
  if (query.studentId && actor.role !== "student") filter.studentId = query.studentId;
  if (query.date) filter.date = query.date;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = query.from;
    if (query.to) filter.date.$lte = query.to;
  }
  const rows = await Attendance.find(filter).sort({ date: -1 }).limit(500).lean();
  const studentIds = [...new Set(rows.map((row) => String(row.studentId)))];
  const students = await User.find({ _id: { $in: studentIds } }).select("name").lean();
  const names = new Map(students.map((student) => [String(student._id), student.name]));
  return rows.map((row) => ({
    id: String(row._id),
    batchId: String(row.batchId),
    studentId: String(row.studentId),
    studentName: names.get(String(row.studentId)) || "",
    date: row.date,
    status: row.status,
  }));
}

export async function attendanceSummary(actor, query) {
  if (!canViewBatchAttendance(actor.role)) throw new ApiError(403, "FORBIDDEN", "You cannot view this report");
  if (!query.batchId) throw new ApiError(400, "BATCH", "Choose a batch");
  await assertBatchVisible(actor, query.batchId);
  const from = query.from || todayUtc().slice(0, 8) + "01";
  const to = query.to || todayUtc();
  const rows = await Attendance.aggregate([
    { $match: { batchId: (await Batch.findById(query.batchId))._id, date: { $gte: from, $lte: to } } },
    { $group: { _id: { studentId: "$studentId", status: "$status" }, count: { $sum: 1 } } },
  ]);
  const students = await StudentProfile.find({ batchId: query.batchId }).populate("userId", "name");
  return students.map((profile) => {
    const counts = { present: 0, absent: 0, leave: 0 };
    rows
      .filter((row) => String(row._id.studentId) === String(profile.userId._id || profile.userId))
      .forEach((row) => {
        counts[row._id.status] = row.count;
      });
    return { studentId: String(profile.userId._id || profile.userId), studentName: profile.userId.name || "", ...counts };
  });
}

export async function batchRoster(actor, batchId) {
  if (actor.role === "student") throw new ApiError(403, "FORBIDDEN", "Your batch is available from your dashboard");
  const batch = await assertBatchVisible(actor, batchId);
  const profiles = await StudentProfile.find({ batchId: batch.id }).populate("userId", "name email phone status avatar");
  return profiles.map((profile) => ({
    userId: String(profile.userId._id),
    name: profile.userId.name,
    email: actor.role === "student" ? undefined : profile.userId.email,
    registrationId: profile.registrationId,
  }));
}
