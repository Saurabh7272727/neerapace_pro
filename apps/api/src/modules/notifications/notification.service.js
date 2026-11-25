import { Notification } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";

function present(item) {
  return {
    id: String(item._id),
    type: item.type,
    title: item.title,
    body: item.body,
    link: item.link || "",
    readAt: item.readAt,
    createdAt: item.createdAt,
  };
}

export async function listNotifications(userId) {
  const items = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  return items.map(present);
}

export async function unreadCount(userId) {
  const count = await Notification.countDocuments({ userId, readAt: null });
  return { count };
}

export async function markNotificationRead(userId, id) {
  const item = await Notification.findOne({ _id: id, userId });
  if (!item) throw new ApiError(404, "NOT_FOUND", "Notification not found");
  if (!item.readAt) {
    item.readAt = new Date();
    await item.save();
  }
  return present(item);
}

export async function markAllRead(userId) {
  await Notification.updateMany({ userId, readAt: null }, { $set: { readAt: new Date() } });
  return { ok: true };
}
