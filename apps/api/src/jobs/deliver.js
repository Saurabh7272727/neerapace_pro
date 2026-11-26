import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { sendTemplatedEmail } from "../config/mail.js";
import { getJson } from "../config/redis.js";
import { getIo } from "../sockets/io.js";
import { otpMatches } from "../utils/otp.js";
import { openOtpPayload } from "../utils/otpSecrets.js";
import { Announcement, Batch, Notification, StudentProfile, User, ConversationParticipant, Message } from "../models/index.js";

async function rememberNotification({ userId, type, title, body, link, refId, email }) {
  const existing = refId ? await Notification.findOne({ userId, type, refId }) : null;
  let doc = existing;
  let created = false;
  if (!doc) {
    try {
      doc = await Notification.create({
        userId,
        type,
        title,
        body,
        link: link || "",
        refId: refId || "",
        emailSent: false,
      });
      created = true;
    } catch (error) {
      if (error?.code !== 11000 || !refId) throw error;
      doc = await Notification.findOne({ userId, type, refId });
      if (!doc) throw error;
    }
  }
  if (created) {
    getIo()?.to(`user:${userId}`).emit("notification:new", {
      id: String(doc.id),
      type,
      title,
      body,
      link: link || "",
      createdAt: doc.createdAt,
    });
  }
  if (email && !doc.emailSent) {
    const claimed = await Notification.findOneAndUpdate(
      {
        _id: doc._id,
        emailSent: false,
        $or: [
          { emailClaimedAt: null },
          { emailClaimedAt: { $exists: false } },
          { emailClaimedAt: { $lt: new Date(Date.now() - 2 * 60_000) } },
        ],
      },
      { $set: { emailClaimedAt: new Date() } },
      { new: true },
    );
    if (claimed) {
      try {
        const result = await sendTemplatedEmail({
          to: email,
          subject: title,
          intro: body,
          action: link
            ? { instructions: "You can open the academy site for the full update.", text: "Open Neera Pace", link: `${env.CLIENT_ORIGIN}${link}` }
            : undefined,
        });
        if (result.skipped) throw new Error("SMTP is not configured; notification email was not sent");
        await Notification.updateOne({ _id: doc._id }, { $set: { emailSent: true, emailClaimedAt: null } });
      } catch (error) {
        await Notification.updateOne({ _id: doc._id }, { $set: { emailClaimedAt: null } });
        throw error;
      }
    }
  }
  return doc;
}

async function deliverOtp(data, subject) {
  data = openOtpPayload(data);
  const current = await getJson(`otp:${data.purpose}:${data.email}`);
  if (!current || !otpMatches(data.otp, current.hash)) {
    logger.warn("Expired or replaced OTP email was skipped", { purpose: data.purpose });
    return;
  }
  await sendTemplatedEmail({
    to: { email: data.email, name: data.name },
    subject,
    intro: `Your one-time code is ${data.otp}. It expires in 10 minutes. If you did not request it, you can ignore this email.`,
  });
}

async function deliverAdmissionSubmitted(data) {
  const user = await User.findById(data.userId);
  const profile = await StudentProfile.findOne({ userId: data.userId });
  if (!user || !profile) return;
  await rememberNotification({
    userId: user.id,
    type: "admission",
    title: "Application received",
    body: `We received your application. Your registration ID is ${profile.registrationId}. The academy will review it shortly.`,
    link: "/app/student",
    refId: `submitted:${profile.registrationId}`,
    email: { email: user.email, name: user.name },
  });
}

async function deliverAdmissionDecided(data) {
  const user = await User.findById(data.userId);
  const profile = await StudentProfile.findOne({ userId: data.userId });
  if (!user || !profile) return;
  const approved = data.decision === "approved";
  await rememberNotification({
    userId: user.id,
    type: "admission",
    title: approved ? "Admission approved" : "Admission update",
    body: approved
      ? `Your place at Neera Pace is confirmed. Registration ID: ${profile.registrationId}.`
      : `Your application was not approved. ${profile.reviewNote || ""}`.trim(),
    link: "/app/student",
    refId: `decision:${profile.registrationId}:${data.decision}`,
    email: { email: user.email, name: user.name },
  });
}

async function audienceUsers(announcement) {
  if (announcement.audience === "coaches") {
    return User.find({ role: "coach", status: "active", deletedAt: null }).select("name email");
  }
  if (announcement.audience === "students") {
    return User.find({ role: "student", status: "active", deletedAt: null }).select("name email");
  }
  if (announcement.audience === "batch") {
    const profiles = await StudentProfile.find({ batchId: announcement.batchId }).select("userId");
    const batch = await Batch.findById(announcement.batchId).select("coachIds");
    const ids = [...profiles.map((profile) => profile.userId), ...(batch?.coachIds || [])];
    return User.find({ _id: { $in: ids }, status: "active", deletedAt: null }).select("name email");
  }
  return User.find({ role: { $in: ["student", "coach", "admin"] }, status: "active", deletedAt: null }).select("name email");
}

async function deliverAnnouncement(data) {
  const announcement = await Announcement.findById(data.announcementId);
  if (!announcement?.publishedAt) return;
  const users = await audienceUsers(announcement);
  for (const user of users) {
    await rememberNotification({
      userId: user.id,
      type: "announcement",
      title: announcement.title,
      body: announcement.body,
      link: "/app/announcements",
      refId: `announcement:${announcement.id}`,
      email: { email: user.email, name: user.name },
    });
  }
}

async function deliverNotificationEmail(data) {
  await rememberNotification({
    userId: data.userId,
    type: data.type || "general",
    title: data.title,
    body: data.body,
    link: data.link,
    refId: data.refId,
    email: data.email ? { email: data.email, name: data.name } : undefined,
  });
}

async function deliverUnreadNudge(data) {
  const message = await Message.findById(data.messageId);
  if (!message) return;
  const participant = await ConversationParticipant.findOne({ conversationId: message.conversationId, userId: data.recipientId });
  if (!participant) return;
  if (participant.lastReadAt && participant.lastReadAt >= message.createdAt) return;
  const user = await User.findById(data.recipientId).select("name email");
  if (!user) return;
  await rememberNotification({
    userId: user.id,
    type: "message",
    title: "New message",
    body: `${data.senderName || "Someone"} sent you a message on Neera Pace.`,
    link: "/app/chat",
    refId: `message:${message.id}`,
    email: { email: user.email, name: user.name },
  });
}

export async function runJob(name, data) {
  if (name === "auth/otp.requested") return deliverOtp(data, "Your Neera Pace verification code");
  if (name === "auth/password-reset.requested") return deliverOtp(data, "Reset your Neera Pace password");
  if (name === "admission/submitted") return deliverAdmissionSubmitted(data);
  if (name === "admission/decided") return deliverAdmissionDecided(data);
  if (name === "announcement/published") return deliverAnnouncement(data);
  if (name === "notification/email") return deliverNotificationEmail(data);
  if (name === "chat/unread.nudge") return deliverUnreadNudge(data);
  logger.warn("Unknown job", name);
}
