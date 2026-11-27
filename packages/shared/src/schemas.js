import { z } from "zod";
import { ANNOUNCEMENT_AUDIENCES, ATTENDANCE_STATUSES, BATCH_STATUSES, ENQUIRY_STATUSES, GENDERS, OTP_PURPOSES } from "./constants.js";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date");

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email")
  .max(160)
  .transform((value) => value.toLowerCase());

export const phoneSchema = z
  .string()
  .trim()
  .min(8, "Enter a valid phone number")
  .max(20)
  .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72)
  .regex(/[A-Za-z]/, "Include a letter")
  .regex(/\d/, "Include a number");

export const otpSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

const optionalEmail = z
  .string()
  .trim()
  .max(160)
  .refine((value) => value === "" || z.string().email().safeParse(value).success, "Enter a valid email");

const optionalHttpsUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https:\/\/\S+$/.test(value), "Image URL must start with https://");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  dateOfBirth: dateSchema.refine((value) => value <= new Date().toISOString().slice(0, 10), "Date of birth cannot be in the future"),
  gender: z.enum(GENDERS),
  address: z.string().trim().min(5).max(300),
  guardianName: z.string().trim().min(2).max(80),
  guardianPhone: phoneSchema,
  guardianEmail: optionalEmail.optional().default(""),
  programId: objectIdSchema,
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  purpose: z.enum(OTP_PURPOSES).default("verify"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(72),
});

export const resendOtpSchema = z.object({
  email: emailSchema,
  purpose: z.enum(OTP_PURPOSES),
});

export const forgotSchema = z.object({
  email: emailSchema,
});

export const resetSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  password: passwordSchema,
});

export const admissionDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(500).optional().default(""),
});

export const programSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(2).max(1000),
  ageGroup: z.string().trim().min(1).max(40),
  scheduleSummary: z.string().trim().min(1).max(200),
  imageUrl: optionalHttpsUrl.optional().default(""),
  isPublished: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
});

export const coachCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  bio: z.string().trim().max(1000).optional().default(""),
  specialization: z.string().trim().max(120).optional().default(""),
  experienceYears: z.coerce.number().int().min(0).max(60).optional().default(0),
  isPublic: z.boolean().optional().default(true),
});

export const coachUpdateSchema = coachCreateSchema.partial().omit({ password: true, email: true });

export const batchSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    programId: objectIdSchema,
    schedule: z.string().trim().min(2).max(200),
    capacity: z.coerce.number().int().min(1).max(200),
    status: z.enum(BATCH_STATUSES).optional().default("upcoming"),
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export const assignUserSchema = z.object({
  userId: objectIdSchema,
});

export const attendanceMarkSchema = z.object({
  batchId: objectIdSchema,
  date: dateSchema,
  records: z
    .array(
      z.object({
        studentId: objectIdSchema,
        status: z.enum(ATTENDANCE_STATUSES),
      }),
    )
    .min(1)
    .max(200),
});

export const attendanceQuerySchema = z.object({
  batchId: objectIdSchema.optional(),
  studentId: objectIdSchema.optional(),
  date: dateSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export const enquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: z.union([phoneSchema, z.literal("")]).optional().default(""),
  message: z.string().trim().min(10).max(2000),
});

export const enquiryStatusSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES),
});

export const announcementSchema = z
  .object({
    title: z.string().trim().min(2).max(140),
    body: z.string().trim().min(2).max(5000),
    audience: z.enum(ANNOUNCEMENT_AUDIENCES),
    batchId: objectIdSchema.optional().nullable(),
    publish: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.audience === "batch" && !value.batchId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Choose a batch", path: ["batchId"] });
    }
  });

export const pageSchema = z.object({
  title: z.string().trim().min(2).max(120),
  heroTitle: z.string().trim().max(160).optional().default(""),
  heroSubtitle: z.string().trim().max(300).optional().default(""),
  bodyHtml: z.string().max(20000).optional().default(""),
  published: z.boolean().optional().default(true),
});

export const gallerySchema = z.object({
  imageUrl: z.string().url().refine((value) => value.startsWith("https://"), "Image URL must start with https://"),
  publicId: z.string().max(200).optional().default(""),
  caption: z.string().trim().max(200).optional().default(""),
  album: z.string().trim().max(80).optional().default("Academy"),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  published: z.boolean().optional().default(true),
});

export const bannerSchema = z.object({
  imageUrl: z.string().url().refine((value) => value.startsWith("https://"), "Image URL must start with https://"),
  publicId: z.string().max(200).optional().default(""),
  caption: z.string().trim().min(2).max(200),
  playerName: z.string().trim().min(2).max(80),
  tag: z.string().trim().max(48).optional().default(""),
  country: z.string().trim().max(80).optional().default(""),
  teamName: z.string().trim().max(100).optional().default(""),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  published: z.boolean().optional().default(true),
});

export const studentUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phoneSchema.optional(),
  address: z.string().trim().max(300).optional(),
  guardianName: z.string().trim().min(2).max(80).optional(),
  guardianPhone: phoneSchema.optional(),
  programId: objectIdSchema.optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phoneSchema.optional(),
  address: z.string().trim().max(300).optional(),
  guardianPhone: phoneSchema.optional(),
  bio: z.string().trim().max(1000).optional(),
  specialization: z.string().trim().max(120).optional(),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  isPublic: z.boolean().optional(),
  avatarUrl: optionalHttpsUrl.optional(),
  avatarPublicId: z.string().max(200).optional(),
});

export const adminStudentSchema = registerSchema;

export const userStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

export const messageSchema = z
  .object({
    body: z.string().trim().max(2000).optional().default(""),
    imageUrl: optionalHttpsUrl.optional().default(""),
    imagePublicId: z.string().max(200).optional().default(""),
  })
  .refine((value) => value.body || value.imageUrl, { message: "Write a message or attach an image" });

export const directChatSchema = z.object({
  participantId: objectIdSchema,
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  q: z.string().trim().max(80).optional().default(""),
  role: z.enum(["admin", "coach", "student"]).optional(),
  status: z.string().trim().max(40).optional().default(""),
});
