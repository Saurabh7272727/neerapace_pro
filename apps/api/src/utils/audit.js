import { AuditLog } from "../models/index.js";
import { logger } from "../config/logger.js";

export async function recordAudit(actorId, action, target, meta = {}) {
  try {
    await AuditLog.create({ actorId, action, target, meta });
  } catch (error) {
    logger.error("Audit log failed", error.message);
  }
}
