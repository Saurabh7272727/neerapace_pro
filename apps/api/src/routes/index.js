import { Router } from "express";
import multer from "multer";
import sanitizeHtml from "sanitize-html";
import {
  admissionDecisionSchema,
  announcementSchema,
  bannerSchema,
  assignUserSchema,
  attendanceMarkSchema,
  attendanceQuerySchema,
  batchSchema,
  coachCreateSchema,
  coachUpdateSchema,
  directChatSchema,
  enquirySchema,
  enquiryStatusSchema,
  gallerySchema,
  messageSchema,
  pageSchema,
  programSchema,
  registerSchema,
  studentUpdateSchema,
  UPLOAD_FOLDERS,
  userStatusSchema,
} from "@neerapace/shared";
import { getCloudinary } from "../config/cloudinary.js";
import { sendAdminEmail } from "../config/mail.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sensitiveLimiter } from "../middleware/rateLimit.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import * as announcements from "../modules/announcements/announcement.service.js";
import * as attendance from "../modules/attendance/attendance.service.js";
import * as batches from "../modules/batches/batch.service.js";
import * as chat from "../modules/chat/chat.service.js";
import * as coaches from "../modules/coaches/coach.service.js";
import * as content from "../modules/content/content.service.js";
import * as notifications from "../modules/notifications/notification.service.js";
import * as stats from "../modules/stats/stats.service.js";
import * as students from "../modules/students/student.service.js";
import * as users from "../modules/users/user.service.js";
import authRoutes from "../modules/auth/auth.routes.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/index.js";

const router = Router();
const enquiryLimit = sensitiveLimiter("enquiry", 8, 60 * 60 * 1000);
const uploadLimit = sensitiveLimiter("upload", 60, 60 * 60 * 1000);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const admin = [requireAuth, requireRole("admin")];

function sniffImage(buffer) {
  if (!buffer || buffer.length < 12) return false;
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return true;
  if (buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG") return true;
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return true;
  if (buffer.toString("ascii", 0, 3) === "GIF") return true;
  return false;
}

router.use("/auth", authRoutes);

router.get("/pages/:slug", asyncHandler(async (req, res) => {
  res.json({ data: await content.getPublicPage(req.params.slug) });
}));
router.get("/pages", ...admin, asyncHandler(async (_req, res) => {
  res.json({ data: await content.listPages() });
}));
router.put("/pages/:slug", ...admin, validateBody(pageSchema), asyncHandler(async (req, res) => {
  res.json({ data: await content.updatePage(req.params.slug, req.body) });
}));

router.get("/programs", asyncHandler(async (_req, res) => {
  res.json({ data: await content.listPublicPrograms() });
}));
router.get("/programs/all", ...admin, asyncHandler(async (_req, res) => {
  res.json({ data: await content.listAllPrograms() });
}));
router.post("/programs", ...admin, validateBody(programSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await content.createProgram(req.body) });
}));
router.patch("/programs/:id", ...admin, validateBody(programSchema), asyncHandler(async (req, res) => {
  res.json({ data: await content.updateProgram(req.params.id, req.body) });
}));
router.delete("/programs/:id", ...admin, asyncHandler(async (req, res) => {
  res.json({ data: await content.removeProgram(req.params.id) });
}));

router.get("/coaches", asyncHandler(async (_req, res) => {
  res.json({ data: await coaches.listPublicCoaches() });
}));
router.get("/coaches/manage", ...admin, asyncHandler(async (_req, res) => {
  res.json({ data: await coaches.listCoaches() });
}));
router.post("/coaches", ...admin, validateBody(coachCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await coaches.createCoach(req.user, req.body) });
}));
router.patch("/coaches/:userId", ...admin, validateBody(coachUpdateSchema), asyncHandler(async (req, res) => {
  res.json({ data: await coaches.updateCoach(req.user, req.params.userId, req.body) });
}));
router.delete("/coaches/:userId", ...admin, asyncHandler(async (req, res) => {
  res.json({ data: await coaches.removeCoach(req.user, req.params.userId) });
}));

router.get("/gallery", asyncHandler(async (_req, res) => {
  res.json({ data: await content.listPublicGallery() });
}));
router.get("/gallery/manage", ...admin, asyncHandler(async (_req, res) => {
  res.json({ data: await content.listGallery() });
}));
router.post("/gallery", ...admin, validateBody(gallerySchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await content.createGalleryItem(req.body) });
}));
router.patch("/gallery/:id", ...admin, validateBody(gallerySchema), asyncHandler(async (req, res) => {
  res.json({ data: await content.updateGalleryItem(req.params.id, req.body) });
}));
router.delete("/gallery/:id", ...admin, asyncHandler(async (req, res) => {
  res.json({ data: await content.removeGalleryItem(req.params.id) });
}));

router.get("/banners", asyncHandler(async (_req, res) => {
  res.json({ data: await content.listPublicBanners() });
}));
router.get("/banners/manage", ...admin, asyncHandler(async (_req, res) => {
  res.json({ data: await content.listBanners() });
}));
router.post("/banners", ...admin, validateBody(bannerSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await content.createBanner(req.body) });
}));
router.patch("/banners/:id", ...admin, validateBody(bannerSchema), asyncHandler(async (req, res) => {
  res.json({ data: await content.updateBanner(req.params.id, req.body) });
}));
router.delete("/banners/:id", ...admin, asyncHandler(async (req, res) => {
  res.json({ data: await content.removeBanner(req.params.id) });
}));

router.post("/enquiries", enquiryLimit, validateBody(enquirySchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await content.createEnquiry(req.body) });
}));
router.get("/enquiries", ...admin, asyncHandler(async (req, res) => {
  const result = await content.listEnquiries(req.query);
  res.json({ data: result.items, meta: result.meta });
}));
router.patch("/enquiries/:id", ...admin, validateBody(enquiryStatusSchema), asyncHandler(async (req, res) => {
  res.json({ data: await content.updateEnquiry(req.params.id, req.body.status) });
}));

router.get("/announcements/public", asyncHandler(async (_req, res) => {
  res.json({ data: await content.listPublicAnnouncements() });
}));
router.get("/announcements", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await announcements.listForUser(req.user) });
}));
router.post("/announcements", ...admin, validateBody(announcementSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await announcements.createAnnouncement(req.user, req.body) });
}));
router.post("/announcements/:id/publish", ...admin, asyncHandler(async (req, res) => {
  res.json({ data: await announcements.publishAnnouncement(req.params.id) });
}));
router.delete("/announcements/:id", ...admin, asyncHandler(async (req, res) => {
  res.json({ data: await announcements.removeAnnouncement(req.params.id) });
}));

router.get("/admissions", ...admin, asyncHandler(async (req, res) => {
  const result = await students.listAdmissions(req.query);
  res.json({ data: result.items, meta: result.meta });
}));
router.post("/admissions/:userId/decision", ...admin, validateBody(admissionDecisionSchema), asyncHandler(async (req, res) => {
  res.json({ data: await students.decideAdmission(req.user, req.params.userId, req.body) });
}));

router.get("/students/me", requireAuth, requireRole("student"), asyncHandler(async (req, res) => {
  res.json({ data: await students.getOwnStudent(req.user.id) });
}));
router.get("/students", requireAuth, requireRole("admin", "coach", "student"), asyncHandler(async (req, res) => {
  const result = await students.listStudentsFor(req.user, req.query);
  res.json({ data: result.items, meta: result.meta });
}));
router.post("/students", ...admin, validateBody(registerSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await students.createStudent(req.user, req.body) });
}));
router.patch("/students/:userId", ...admin, validateBody(studentUpdateSchema), asyncHandler(async (req, res) => {
  res.json({ data: await students.updateStudent(req.user, req.params.userId, req.body) });
}));
router.delete("/students/:userId", ...admin, asyncHandler(async (req, res) => {
  res.json({ data: await students.removeStudent(req.user, req.params.userId) });
}));

router.get("/users", ...admin, asyncHandler(async (req, res) => {
  res.json({ data: await users.listUsers(req.query) });
}));
router.patch("/users/:userId/status", ...admin, validateBody(userStatusSchema), asyncHandler(async (req, res) => {
  res.json({ data: await users.setUserStatus(req.user, req.params.userId, req.body.status) });
}));

router.get("/batches", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await batches.listBatches(req.user) });
}));
router.post("/batches", ...admin, validateBody(batchSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await batches.createBatch(req.user, req.body) });
}));
router.patch("/batches/:id", ...admin, validateBody(batchSchema), asyncHandler(async (req, res) => {
  res.json({ data: await batches.updateBatch(req.user, req.params.id, req.body) });
}));
router.delete("/batches/:id", ...admin, asyncHandler(async (req, res) => {
  res.json({ data: await batches.removeBatch(req.user, req.params.id) });
}));
router.post("/batches/:id/coaches", ...admin, validateBody(assignUserSchema), asyncHandler(async (req, res) => {
  res.json({ data: await batches.assignCoach(req.user, req.params.id, req.body.userId) });
}));
router.delete("/batches/:id/coaches/:userId", ...admin, asyncHandler(async (req, res) => {
  res.json({ data: await batches.removeCoachFromBatch(req.user, req.params.id, req.params.userId) });
}));
router.post("/batches/:id/students", ...admin, validateBody(assignUserSchema), asyncHandler(async (req, res) => {
  res.json({ data: await batches.assignStudent(req.user, req.params.id, req.body.userId) });
}));
router.delete("/batches/:id/students/:userId", ...admin, asyncHandler(async (req, res) => {
  res.json({ data: await batches.removeStudentFromBatch(req.user, req.params.id, req.params.userId) });
}));
router.get("/batches/:id/roster", requireAuth, requireRole("admin", "coach"), asyncHandler(async (req, res) => {
  res.json({ data: await attendance.batchRoster(req.user, req.params.id) });
}));

router.get("/attendance", requireAuth, validateQuery(attendanceQuerySchema), asyncHandler(async (req, res) => {
  res.json({ data: await attendance.listAttendance(req.user, req.query) });
}));
router.get("/attendance/summary", requireAuth, requireRole("admin", "coach"), validateQuery(attendanceQuerySchema), asyncHandler(async (req, res) => {
  res.json({ data: await attendance.attendanceSummary(req.user, req.query) });
}));
router.put("/attendance", ...admin, validateBody(attendanceMarkSchema), asyncHandler(async (req, res) => {
  res.json({ data: await attendance.markAttendance(req.user, req.body) });
}));

router.get("/notifications", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await notifications.listNotifications(req.user.id) });
}));
router.get("/notifications/unread", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await notifications.unreadCount(req.user.id) });
}));
router.post("/notifications/read-all", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await notifications.markAllRead(req.user.id) });
}));
router.post("/notifications/:id/read", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await notifications.markNotificationRead(req.user.id, req.params.id) });
}));

router.get("/chat/contacts", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await chat.listContacts(req.user) });
}));
router.get("/chat/conversations", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await chat.listConversations(req.user.id) });
}));
router.post("/chat/conversations", requireAuth, validateBody(directChatSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await chat.openDirect(req.user, req.body.participantId) });
}));
router.get("/chat/conversations/:id/messages", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await chat.listMessages(req.user.id, req.params.id, req.query.before) });
}));
router.post("/chat/conversations/:id/messages", requireAuth, validateBody(messageSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await chat.sendMessage({ user: req.user, conversationId: req.params.id, ...req.body }) });
}));
router.post("/chat/email", ...admin, asyncHandler(async (req, res) => {
  const { studentId, subject, html, attachments = [] } = req.body || {};
  if (typeof subject !== "string" || !subject.trim() || subject.length > 180 || typeof html !== "string" || !html.trim() || html.length > 100_000 || !Array.isArray(attachments) || attachments.length > 3) {
    throw new ApiError(400, "EMAIL", "Add a subject and message. Up to three documents are allowed.");
  }
  const student = await User.findOne({ _id: studentId, role: "student", deletedAt: null, status: "active" }).select("email name");
  if (!student) throw new ApiError(404, "STUDENT", "The active student could not be found");
  const allowed = new Map([["application/pdf", "pdf"], ["application/msword", "doc"], ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"]]);
  const files = attachments.map((file) => {
    const ext = allowed.get(file?.contentType);
    if (!ext || typeof file.filename !== "string" || typeof file.content !== "string" || file.content.length > 260_000 || !file.filename.toLowerCase().endsWith(`.${ext}`)) {
      throw new ApiError(400, "ATTACHMENT", "Attach PDF, DOC or DOCX documents under 180 KB each.");
    }
    const content = Buffer.from(file.content, "base64");
    const validFile = file.contentType === "application/pdf"
      ? content.subarray(0, 5).toString("ascii") === "%PDF-"
      : file.contentType === "application/msword"
        ? content.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]))
        : content.subarray(0, 2).toString("hex") === "504b";
    if (!content.length || content.length > 180 * 1024 || !validFile) throw new ApiError(400, "ATTACHMENT", "The selected document is invalid or exceeds 180 KB.");
    return { filename: file.filename.replace(/[^a-zA-Z0-9._-]/g, "_"), content, contentType: file.contentType };
  });
  const safeBody = sanitizeHtml(html, { allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h2", "h3", "blockquote", "a"], allowedAttributes: { a: ["href"] }, allowedSchemes: ["https", "mailto"] });
  const wrapped = `<div style="font-family:Arial,sans-serif;color:#17251f;max-width:640px;margin:auto;line-height:1.65"><div style="padding:18px 22px;background:#12372a;color:#fff;font-weight:700">Neera Pace Cricket Academy</div><div style="padding:24px">${safeBody}</div><hr style="border:0;border-top:1px solid #e5e7eb"><p style="padding:0 24px;color:#66736d;font-size:12px">Academy communication · Neera Pace</p></div>`;
  const result = await sendAdminEmail({ to: student.email, subject: subject.trim(), html: wrapped, text: safeBody.replace(/<\/(p|li|h2|h3)>/gi, "\n").replace(/<[^>]*>/g, " ").trim(), attachments: files });
  if (result.skipped) throw new ApiError(503, "EMAIL_UNAVAILABLE", "Email is not configured. Add SMTP settings to the server environment.");
  res.json({ data: { sent: true } });
}));
router.post("/chat/conversations/:id/read", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await chat.markRead(req.user.id, req.params.id) });
}));

router.get("/stats/admin", ...admin, asyncHandler(async (_req, res) => {
  res.json({ data: await stats.adminStats() });
}));

router.post("/uploads", requireAuth, uploadLimit, (req, res, next) => {
  upload.single("file")(req, res, (error) => (error ? next(error) : next()));
}, asyncHandler(async (req, res) => {
  const folder = String(req.body?.folder || "");
  if (!UPLOAD_FOLDERS.includes(folder)) throw new ApiError(400, "UPLOAD", "Choose a valid image folder");
  if ((folder === "gallery" || folder === "banners" || folder === "content") && req.user.role !== "admin") {
    throw new ApiError(403, "FORBIDDEN", "You cannot upload to that folder");
  }
  if (folder === "chat" && req.user.status !== "active") throw new ApiError(403, "ACCOUNT_INACTIVE", "Chat uploads require an active account");
  if (!req.file || !sniffImage(req.file.buffer)) throw new ApiError(400, "UPLOAD", "Upload a JPEG, PNG, WEBP, or GIF image under 10 MB");
  const client = getCloudinary();
  if (!client) throw new ApiError(503, "UPLOADS_UNAVAILABLE", "Image storage is not configured");
  const uploaded = await new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream({ folder: `neerapace/${folder}`, resource_type: "image", format: "webp" }, (error, result) => (error ? reject(error) : resolve(result)));
    stream.end(req.file.buffer);
  });
  res.status(201).json({ data: { url: uploaded.secure_url, publicId: uploaded.public_id } });
}));

export default router;
