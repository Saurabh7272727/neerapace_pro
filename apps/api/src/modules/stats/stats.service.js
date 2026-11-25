import { todayUtc } from "@neerapace/shared";
import { cacheAside } from "../../config/redis.js";
import { cacheKeys } from "../../config/cacheKeys.js";
import { Attendance, Batch, Enquiry, StudentProfile } from "../../models/index.js";

export async function adminStats() {
  return cacheAside(cacheKeys.stats, 60, async () => {
    const [students, pending, activeBatches, presentToday, newEnquiries] = await Promise.all([
      StudentProfile.countDocuments({ admissionStatus: "approved" }),
      StudentProfile.countDocuments({ admissionStatus: "under_review" }),
      Batch.countDocuments({ status: "active", deletedAt: null }),
      Attendance.countDocuments({ date: todayUtc(), status: "present" }),
      Enquiry.countDocuments({ status: "new" }),
    ]);
    return { students, pending, activeBatches, presentToday, newEnquiries };
  });
}
