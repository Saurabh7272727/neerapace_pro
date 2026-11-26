import { Server } from "socket.io";
import { env } from "../config/env.js";
import { cacheDel, cacheSet } from "../config/redis.js";
import { isParticipant, markRead, sendMessage } from "../modules/chat/chat.service.js";
import { User } from "../models/index.js";
import { readCookie } from "../utils/http.js";
import { verifyAccess } from "../utils/tokens.js";
import { setIo } from "./io.js";

export function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });
  setIo(io);

  io.use(async (socket, next) => {
    try {
      const token = readCookie(socket.handshake.headers.cookie || "", "np_access");
      if (!token) return next(new Error("unauthorized"));
      const payload = verifyAccess(token);
      const user = await User.findOne({ _id: payload.sub, deletedAt: null }).select("role status name authVersion");
      if (!user || !["active", "pending_approval", "rejected"].includes(user.status) || (payload.ver ?? 0) !== (user.authVersion ?? 0)) return next(new Error("unauthorized"));
      socket.user = user;
      return next();
    } catch {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.user.id);
    socket.join(`user:${userId}`);
    cacheSet(`presence:${userId}`, "1", 60).catch(() => {});
    io.emit("presence", { userId, online: true });
    const heartbeat = setInterval(() => {
      cacheSet(`presence:${userId}`, "1", 60).catch(() => {});
    }, 25_000);

    socket.on("conversation:join", async (conversationId, ack) => {
      try {
        const allowed = await isParticipant(conversationId, socket.user.id);
        if (!allowed) return ack?.({ ok: false });
        socket.join(`conversation:${conversationId}`);
        return ack?.({ ok: true });
      } catch {
        return ack?.({ ok: false, error: "Conversation could not be opened" });
      }
    });

    socket.on("message:send", async (payload = {}, ack) => {
      try {
        const message = await sendMessage({
          user: socket.user,
          conversationId: payload.conversationId,
          body: payload.body,
          imageUrl: payload.imageUrl,
          imagePublicId: payload.imagePublicId,
        });
        ack?.({ ok: true, message });
      } catch (error) {
        ack?.({ ok: false, error: error?.status && error.status < 500 ? error.message : "Message failed" });
      }
    });

    socket.on("typing", (payload = {}) => {
      if (!payload.conversationId || !socket.rooms.has(`conversation:${payload.conversationId}`)) return;
      socket.to(`conversation:${payload.conversationId}`).emit("typing", {
        conversationId: payload.conversationId,
        userId,
        name: socket.user.name,
      });
    });

    socket.on("conversation:read", async (payload = {}) => {
      if (!payload.conversationId) return;
      try {
        await markRead(socket.user.id, payload.conversationId);
      } catch {
        /* Read receipts are best-effort over the socket. */
      }
    });

    socket.on("disconnect", async () => {
      clearInterval(heartbeat);
      const room = io.sockets.adapter.rooms.get(`user:${userId}`);
      if (!room || room.size === 0) {
        try {
          await cacheDel(`presence:${userId}`);
          io.emit("presence", { userId, online: false });
        } catch {
          /* Presence cleanup is best-effort. */
        }
      }
    });
  });

  return io;
}
