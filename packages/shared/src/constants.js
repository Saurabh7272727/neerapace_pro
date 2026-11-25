export const ROLES = ["admin", "coach", "student"];

export const USER_STATUSES = [
  "pending_email",
  "pending_approval",
  "active",
  "rejected",
  "suspended",
];

export const LOGIN_STATUSES = ["pending_approval", "active", "rejected"];

export const ADMISSION_STATUSES = ["submitted", "under_review", "approved", "rejected"];

export const ATTENDANCE_STATUSES = ["present", "absent", "leave"];

export const BATCH_STATUSES = ["upcoming", "active", "completed"];

export const ANNOUNCEMENT_AUDIENCES = ["all", "students", "coaches", "batch"];

export const ENQUIRY_STATUSES = ["new", "read", "closed"];

export const GENDERS = ["male", "female", "other"];

export const PAGE_SLUGS = ["home", "about", "programs", "coaches", "facilities", "gallery", "contact"];

export const UPLOAD_FOLDERS = ["avatars", "gallery", "content", "chat"];

export const OTP_PURPOSES = ["verify", "reset"];

export const OTP_TTL_SECONDS = 10 * 60;

export const OTP_MAX_ATTEMPTS = 5;

export const OTP_COOLDOWN_SECONDS = 60;
