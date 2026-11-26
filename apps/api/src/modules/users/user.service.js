import { User } from "../../models/index.js";
import { recordAudit } from "../../utils/audit.js";
import { ApiError } from "../../utils/ApiError.js";
import { publicUser } from "../../utils/presenters.js";
import { disconnectUserSockets } from "../../sockets/io.js";

export async function listUsers(query) {
  const filter = { deletedAt: null };
  if (query.role) filter.role = query.role;
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  return users.map(publicUser);
}

export async function setUserStatus(actor, userId, status) {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");
  if (String(user.id) === String(actor.id)) throw new ApiError(400, "SELF", "You cannot change your own access");
  if (user.status !== status && status === "suspended") user.authVersion = (user.authVersion || 0) + 1;
  user.status = status;
  await user.save();
  if (status === "suspended") disconnectUserSockets(user.id);
  await recordAudit(actor.id, "user.status", String(user.id), { status });
  return publicUser(user);
}
