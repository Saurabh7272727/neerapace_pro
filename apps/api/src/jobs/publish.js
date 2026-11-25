import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { inngest } from "./client.js";
import { runJob } from "./deliver.js";

export async function publish(name, data) {
  const payload = { ...data, idempotencyKey: data.idempotencyKey || `${name}:${Date.now()}` };
  if (env.INNGEST_EVENT_KEY) {
    await inngest.send({ name, data: payload });
    return;
  }
  if (env.NODE_ENV === "production") {
    logger.error("INNGEST_EVENT_KEY is missing. Background job was not queued.", name);
    return;
  }
  const delay = name === "chat/unread.nudge" ? 15_000 : 0;
  setTimeout(() => {
    runJob(name, payload).catch((error) => logger.error("Background job failed", name, error.message));
  }, delay);
}
