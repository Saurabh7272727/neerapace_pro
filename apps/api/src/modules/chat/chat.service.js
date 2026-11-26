import { messageSchema } from "@neerapace/shared";
import { cacheGet, cacheIncr } from "../../config/redis.js";
import { publish } from "../../jobs/publish.js";
import { Batch, Conversation, ConversationParticipant, Message, StudentProfile, User } from "../../models/index.js";
import { getIo } from "../../sockets/io.js";
import { ApiError } from "../../utils/ApiError.js";
import { presentMessage } from "../../utils/presenters.js";
import { sanitizePlain } from "../../utils/sanitize.js";
import { canDirectMessage } from "./permissions.js";

export async function sharesBatch(coachUserId, studentUserId) {
  const profile = await StudentProfile.findOne({ userId: studentUserId }).select("batchId");
  if (!profile?.batchId) return false;
  const batch = await Batch.findOne({ _id: profile.batchId, coachIds: coachUserId, deletedAt: null }).select("_id");
  return Boolean(batch);
}

export async function isParticipant(conversationId, userId) {
  const row = await ConversationParticipant.findOne({ conversationId, userId }).select("_id");
  return Boolean(row);
}

async function presenceFor(ids) {
  const unique = [...new Set(ids.map(String))];
  const entries = await Promise.all(unique.map(async (id) => [id, Boolean(await cacheGet(`presence:${id}`))]));
  return Object.fromEntries(entries);
}

export async function listContacts(actor) {
  const users = await User.find({ deletedAt: null, _id: { $ne: actor.id } }).select("name role status deletedAt");
  const contacts = [];
  for (const user of users) {
    let shares = false;
    if ((actor.role === "coach" && user.role === "student") || (actor.role === "student" && user.role === "coach")) {
      const coachId = actor.role === "coach" ? actor.id : user.id;
      const studentId = actor.role === "student" ? actor.id : user.id;
      shares = await sharesBatch(coachId, studentId);
    }
    if (canDirectMessage({ actor, target: user, sharesBatch: shares })) {
      contacts.push({ id: String(user.id), name: user.name, role: user.role });
    }
  }
  return contacts.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listConversations(userId) {
  const memberships = await ConversationParticipant.find({ userId });
  const unread = new Map(memberships.map((row) => [String(row.conversationId), row.unreadCount || 0]));
  const conversations = await Conversation.find({ _id: { $in: memberships.map((row) => row.conversationId) } })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate("participantIds", "name role");
  const presence = await presenceFor(conversations.flatMap((conversation) => conversation.participantIds.map((person) => person.id)));
  return conversations.map((conversation) => ({
    id: String(conversation.id),
    type: conversation.type,
    title:
      conversation.type === "direct"
        ? conversation.participantIds.find((person) => String(person.id) !== String(userId))?.name || "Conversation"
        : conversation.title,
    batchId: conversation.batchId ? String(conversation.batchId) : null,
    lastMessageAt: conversation.lastMessageAt || null,
    lastMessagePreview: conversation.lastMessagePreview || "",
    unreadCount: unread.get(String(conversation.id)) || 0,
    participants: conversation.participantIds.map((person) => ({
      id: String(person.id),
      name: person.name,
      role: person.role,
      online: Boolean(presence[String(person.id)]),
    })),
  }));
}

export async function openDirect(actor, participantId) {
  const target = await User.findOne({ _id: participantId, deletedAt: null });
  if (!target) throw new ApiError(404, "NOT_FOUND", "That person was not found");
  let shares = false;
  if ((actor.role === "coach" && target.role === "student") || (actor.role === "student" && target.role === "coach")) {
    const coachId = actor.role === "coach" ? actor.id : target.id;
    const studentId = actor.role === "student" ? actor.id : target.id;
    shares = await sharesBatch(coachId, studentId);
  }
  if (!canDirectMessage({ actor, target, sharesBatch: shares })) {
    throw new ApiError(403, "FORBIDDEN", "You cannot message this person");
  }
  const directKey = [String(actor.id), String(target.id)].sort().join(":");
  let conversation = await Conversation.findOne({ directKey });
  if (!conversation) {
    conversation = await Conversation.create({
      type: "direct",
      directKey,
      participantIds: [actor.id, target.id],
      title: "",
    });
    await ConversationParticipant.insertMany([
      { conversationId: conversation.id, userId: actor.id, unreadCount: 0 },
      { conversationId: conversation.id, userId: target.id, unreadCount: 0 },
    ]);
  }
  return { id: String(conversation.id) };
}

export async function listMessages(userId, conversationId, before) {
  if (!(await isParticipant(conversationId, userId))) throw new ApiError(403, "FORBIDDEN", "You are not in this conversation");
  const filter = { conversationId };
  if (before) filter._id = { $lt: before };
  const rows = await Message.find(filter).sort({ _id: -1 }).limit(10).populate("senderId", "name");
  return { items: rows.reverse().map(presentMessage), hasMore: rows.length === 10 };
}

export async function sendMessage({ user, conversationId, body, imageUrl, imagePublicId }) {
  const parsed = messageSchema.parse({ body: body || "", imageUrl: imageUrl || "", imagePublicId: imagePublicId || "" });
  if (user.status === "rejected") throw new ApiError(403, "FORBIDDEN", "Messaging is unavailable for this account");
  if (!(await isParticipant(conversationId, user.id || user._id))) {
    throw new ApiError(403, "FORBIDDEN", "You are not in this conversation");
  }
  const count = await cacheIncr(`rl:msg:${user.id || user._id}`, 60);
  if (count > 30) throw new ApiError(429, "RATE_LIMIT", "You are sending messages too quickly");
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new ApiError(404, "NOT_FOUND", "Conversation not found");
  const message = await Message.create({
    conversationId,
    senderId: user.id || user._id,
    body: sanitizePlain(parsed.body || ""),
    imageUrl: parsed.imageUrl || "",
    imagePublicId: parsed.imagePublicId || "",
  });
  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessagePreview = (message.body || "Sent an image").slice(0, 140);
  await conversation.save();
  await ConversationParticipant.updateMany({ conversationId, userId: { $ne: user.id || user._id } }, { $inc: { unreadCount: 1 } });
  const dto = presentMessage(await Message.findById(message.id).populate("senderId", "name"));
  getIo()?.to(`conversation:${conversationId}`).emit("message:new", dto);
  if (conversation.type === "direct") {
    for (const recipientId of conversation.participantIds.filter((id) => String(id) !== String(user.id || user._id))) {
      if (!(await cacheGet(`presence:${recipientId}`))) {
        await publish("chat/unread.nudge", {
          idempotencyKey: `nudge:${message.id}`,
          messageId: String(message.id),
          recipientId: String(recipientId),
          senderName: user.name,
        });
      }
    }
  }
  return dto;
}

export async function markRead(userId, conversationId) {
  if (!(await isParticipant(conversationId, userId))) throw new ApiError(403, "FORBIDDEN", "You are not in this conversation");
  const readAt = new Date();
  await ConversationParticipant.updateOne({ conversationId, userId }, { $set: { unreadCount: 0, lastReadAt: readAt } });
  getIo()?.to(`conversation:${conversationId}`).emit("message:read", {
    conversationId: String(conversationId),
    userId: String(userId),
    readAt: readAt.toISOString(),
  });
  return { ok: true };
}

export async function syncBatchConversation(batchId) {
  const batch = await Batch.findById(batchId);
  if (!batch) return null;
  const students = batch.deletedAt ? [] : await StudentProfile.find({ batchId: batch.id }).select("userId");
  const admins = batch.deletedAt ? [] : await User.find({ role: "admin", status: "active", deletedAt: null }).select("_id");
  const participantIds = batch.deletedAt
    ? []
    : [...new Set([...batch.coachIds.map(String), ...students.map((student) => String(student.userId)), ...admins.map((admin) => String(admin._id))])];
  let conversation = await Conversation.findOne({ type: "batch", batchId: batch.id });
  const previousParticipantIds = conversation ? conversation.participantIds.map(String) : [];
  if (!conversation) {
    conversation = await Conversation.create({ type: "batch", batchId: batch.id, participantIds, title: batch.name });
  } else {
    conversation.participantIds = participantIds;
    conversation.title = batch.name;
    await conversation.save();
  }
  if (!participantIds.length) {
    await ConversationParticipant.deleteMany({ conversationId: conversation.id });
    for (const removedId of previousParticipantIds) getIo()?.in(`user:${removedId}`).socketsLeave(`conversation:${conversation.id}`);
    return conversation;
  }
  await ConversationParticipant.deleteMany({ conversationId: conversation.id, userId: { $nin: participantIds } });
  for (const userId of participantIds) {
    await ConversationParticipant.updateOne(
      { conversationId: conversation.id, userId },
      { $setOnInsert: { unreadCount: 0 } },
      { upsert: true },
    );
  }
  const currentIds = new Set(participantIds.map(String));
  for (const removedId of previousParticipantIds.filter((id) => !currentIds.has(id))) {
    getIo()?.in(`user:${removedId}`).socketsLeave(`conversation:${conversation.id}`);
  }
  return conversation;
}
