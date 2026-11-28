import bcrypt from "bcryptjs";
import { formatRegistrationId } from "@neerapace/shared";
import { cacheDel } from "../../config/redis.js";
import { cacheKeys } from "../../config/cacheKeys.js";
import { publish } from "../../jobs/publish.js";
import { Attendance, Batch, Conversation, ConversationParticipant, Counter, Enquiry, JobOutbox, Message, Notification, Program, StudentProfile, User } from "../../models/index.js";
import { recordAudit } from "../../utils/audit.js";
import { ApiError } from "../../utils/ApiError.js";
import { pageQuery } from "../../utils/http.js";
import { presentStudent } from "../../utils/presenters.js";
import { sanitizePlain } from "../../utils/sanitize.js";
import { syncBatchConversation } from "../chat/chat.service.js";
import { disconnectUserSockets } from "../../sockets/io.js";

const studentPopulate = [
  { path: "userId", select: "name email phone status avatar" },
  { path: "programId", select: "name" },
  { path: "batchId", select: "name schedule status" },
];

async function nextRegistrationId() {
  const year = new Date().getUTCFullYear();
  const counter = await Counter.findOneAndUpdate({ _id: `registration-${year}` }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return formatRegistrationId(year, counter.seq);
}

export async function listAdmissions(query) {
  const { page, limit, skip, q } = pageQuery(query);
  const filter = {};
  if (query.status) filter.admissionStatus = query.status;
  const profiles = await StudentProfile.find(filter).populate(studentPopulate).sort({ createdAt: -1 });
  const filtered = q
    ? profiles.filter((profile) => {
        const haystack = `${profile.registrationId} ${profile.userId?.name || ""} ${profile.userId?.email || ""}`.toLowerCase();
        return haystack.includes(q.toLowerCase());
      })
    : profiles;
  const slice = filtered.slice(skip, skip + limit);
  return { items: slice.map(presentStudent), meta: { page, limit, total: filtered.length } };
}

export async function decideAdmission(actor, userId, { decision, note }) {
  const profile = await StudentProfile.findOne({ userId }).populate("userId");
  if (!profile) throw new ApiError(404, "NOT_FOUND", "Application not found");
  if (profile.userId.status === "pending_email") {
    throw new ApiError(400, "EMAIL_UNVERIFIED", "The student has not verified their email yet");
  }
  profile.admissionStatus = decision;
  profile.reviewNote = sanitizePlain(note || "");
  profile.reviewedBy = actor.id;
  await profile.save();
  profile.userId.status = decision === "approved" ? "active" : "rejected";
  if (decision === "rejected") profile.userId.authVersion = (profile.userId.authVersion || 0) + 1;
  await profile.userId.save();
  if (decision === "rejected") disconnectUserSockets(profile.userId.id);
  await cacheDel(cacheKeys.stats);
  await recordAudit(actor.id, "admission.decide", String(userId), { decision });
  await publish("admission/decided", {
    idempotencyKey: `admission:${userId}:${decision}:${Date.now()}`,
    userId: String(userId),
    decision,
  });
  const fresh = await StudentProfile.findById(profile.id).populate(studentPopulate);
  return presentStudent(fresh);
}

export async function listStudentsFor(actor, query) {
  const { page, limit, skip, q } = pageQuery(query);
  let filter = {};
  if (actor.role === "coach") {
    const batches = await Batch.find({ coachIds: actor.id, deletedAt: null }).select("_id");
    filter = { batchId: { $in: batches.map((batch) => batch.id) }, admissionStatus: "approved" };
  } else if (actor.role === "student") {
    filter = { userId: actor.id };
  }
  if (actor.role === "admin" && query.status) filter.admissionStatus = query.status;
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingUsers = await User.find({ role: "student", deletedAt: null, name: { $regex: escaped, $options: "i" } }).select("_id").lean();
    filter.$or = [
      { registrationId: { $regex: escaped, $options: "i" } },
      { userId: { $in: matchingUsers.map((user) => user._id) } },
    ];
  }
  const [profiles, total] = await Promise.all([
    StudentProfile.find(filter).populate(studentPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    StudentProfile.countDocuments(filter),
  ]);
  return { items: profiles.map(presentStudent), meta: { page, limit, total } };
}

export async function getOwnStudent(userId) {
  const profile = await StudentProfile.findOne({ userId }).populate(studentPopulate);
  if (!profile) throw new ApiError(404, "NOT_FOUND", "Student profile not found");
  return presentStudent(profile);
}

export async function createStudent(actor, input) {
  const program = await Program.findById(input.programId);
  if (!program) throw new ApiError(400, "PROGRAM", "Choose a program");
  if (await User.findOne({ email: input.email })) throw new ApiError(409, "EMAIL_TAKEN", "An account with that email already exists");
  const user = await User.create({
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, 12),
    role: "student",
    status: "active",
    emailVerifiedAt: new Date(),
    name: sanitizePlain(input.name),
    phone: input.phone,
  });
  try {
    await StudentProfile.create({
      userId: user.id,
      registrationId: await nextRegistrationId(),
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      address: sanitizePlain(input.address),
      guardianName: sanitizePlain(input.guardianName),
      guardianPhone: input.guardianPhone,
      guardianEmail: input.guardianEmail || "",
      programId: program.id,
      admissionStatus: "approved",
      reviewedBy: actor.id,
    });
  } catch (error) {
    await User.deleteOne({ _id: user.id });
    throw error;
  }
  await cacheDel(cacheKeys.stats);
  await recordAudit(actor.id, "student.create", String(user.id), {});
  return getOwnStudent(user.id);
}

export async function updateStudent(actor, userId, input) {
  const profile = await StudentProfile.findOne({ userId });
  const user = await User.findOne({ _id: userId, role: "student", deletedAt: null });
  if (!profile || !user) throw new ApiError(404, "NOT_FOUND", "Student not found");
  if (input.name) user.name = sanitizePlain(input.name);
  if (input.phone) user.phone = input.phone;
  await user.save();
  if (input.address !== undefined) profile.address = sanitizePlain(input.address);
  if (input.guardianPhone) profile.guardianPhone = input.guardianPhone;
  if (input.guardianName) profile.guardianName = sanitizePlain(input.guardianName);
  if (input.programId) profile.programId = input.programId;
  await profile.save();
  await recordAudit(actor.id, "student.update", String(userId), {});
  return getOwnStudent(userId);
}

export async function removeStudent(actor, userId) {
  const profile = await StudentProfile.findOne({ userId });
  const user = await User.findOne({ _id: userId, role: "student", deletedAt: null });
  if (!user) throw new ApiError(404, "NOT_FOUND", "Student not found");

  // Revoke access first so a partial cleanup can never leave a usable account.
  user.status = "suspended";
  user.authVersion = (user.authVersion || 0) + 1;
  await user.save();
  disconnectUserSockets(user.id);

  const previousBatch = profile?.batchId;
  if (profile?.batchId) {
    profile.batchId = null;
    await profile.save();
    await syncBatchConversation(previousBatch);
  }

  const directConversations = await Conversation.find({ type: "direct", participantIds: user._id }).select("_id");
  const directConversationIds = directConversations.map((conversation) => conversation._id);
  const authoredMessages = await Message.find({ senderId: user._id }).select("conversationId");
  const affectedConversationIds = [...new Set(authoredMessages
    .map((message) => String(message.conversationId))
    .filter((id) => !directConversationIds.some((directId) => String(directId) === id)))];

  await Promise.all([
    StudentProfile.deleteOne({ userId: user._id }),
    Attendance.deleteMany({ $or: [{ studentId: user._id }, { markedBy: user._id }] }),
    Notification.deleteMany({ userId: user._id }),
    Enquiry.deleteMany({ email: user.email }),
    ConversationParticipant.deleteMany({ userId: user._id }),
    Conversation.updateMany({ participantIds: user._id }, { $pull: { participantIds: user._id } }),
    Message.deleteMany({ $or: [{ senderId: user._id }, { conversationId: { $in: directConversationIds } }] }),
    Conversation.deleteMany({ _id: { $in: directConversationIds } }),
    JobOutbox.deleteMany({ "data.email": user.email }),
    cacheDel(
      `otp:verify:${user.email}`,
      `otp:reset:${user.email}`,
      `otp:cooldown:verify:${user.email}`,
      `otp:cooldown:reset:${user.email}`,
    ),
    cacheDel(cacheKeys.stats),
  ]);

  // Keep batch conversations usable and remove deleted messages from previews.
  for (const conversationId of affectedConversationIds) {
    const latestMessage = await Message.findOne({ conversationId }).sort({ createdAt: -1 });
    await Conversation.updateOne({ _id: conversationId }, {
      $set: {
        lastMessageAt: latestMessage?.createdAt || null,
        lastMessagePreview: latestMessage ? (latestMessage.body || "Sent an image").slice(0, 140) : "",
      },
    });
  }

  await recordAudit(actor.id, "student.delete", String(userId), {});
  await User.deleteOne({ _id: user._id });
  return { ok: true };
}
