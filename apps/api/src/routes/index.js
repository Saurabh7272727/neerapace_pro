import { Router } from "express";
import multer from "multer";
import {
  admissionDecisionSchema,
  announcementSchema,
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

const router = Router();
const enquiryLimit = sensitiveLimiter("enquiry", 8, 60 * 60 * 1000);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
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
router.post("/chat/conversations/:id/read", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await chat.markRead(req.user.id, req.params.id) });
}));

router.get("/stats/admin", ...admin, asyncHandler(async (_req, res) => {
  res.json({ data: await stats.adminStats() });
}));

router.post("/uploads", requireAuth, (req, res, next) => {
  upload.single("file")(req, res, (error) => (error ? next(error) : next()));
}, asyncHandler(async (req, res) => {
  const folder = String(req.body?.folder || "");
  if (!UPLOAD_FOLDERS.includes(folder)) throw new ApiError(400, "UPLOAD", "Choose a valid image folder");
  if ((folder === "gallery" || folder === "content") && req.user.role !== "admin") {
    throw new ApiError(403, "FORBIDDEN", "You cannot upload to that folder");
  }
  if (folder === "chat" && req.user.status !== "active") throw new ApiError(403, "ACCOUNT_INACTIVE", "Chat uploads require an active account");
  if (!req.file || !sniffImage(req.file.buffer)) throw new ApiError(400, "UPLOAD", "Upload a JPEG, PNG, WEBP, or GIF image under 5 MB");
  const client = getCloudinary();
  if (!client) throw new ApiError(503, "UPLOADS_UNAVAILABLE", "Image storage is not configured");
  const uploaded = await new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream({ folder: `neerapace/${folder}`, resource_type: "image" }, (error, result) => (error ? reject(error) : resolve(result)));
    stream.end(req.file.buffer);
  });
  res.status(201).json({ data: { url: uploaded.secure_url, publicId: uploaded.public_id } });
}));

export default router;
