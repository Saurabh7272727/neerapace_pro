import { OTP_TTL_SECONDS } from "@neerapace/shared";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { getJson } from "../config/redis.js";
import { inngest } from "./client.js";
import { runJob } from "./deliver.js";
import { JobOutbox } from "../models/JobOutbox.js";
import { otpMatches } from "../utils/otp.js";
import { openOtpPayload, sealOtpPayload } from "../utils/otpSecrets.js";

let drainRunning = false;
let outboxTimer;

async function drainOne() {
  const now = new Date();
  const record = await JobOutbox.findOneAndUpdate(
    {
      $or: [
        { status: "pending", nextAttemptAt: { $lte: now } },
        { status: "sending", leaseUntil: { $lte: now } },
      ],
    },
    { $set: { status: "sending", leaseUntil: new Date(now.getTime() + 60_000) }, $inc: { attempts: 1 } },
    { sort: { createdAt: 1 }, new: true },
  );
  if (!record) return false;

  try {
    const payload = openOtpPayload(record.data);
    if (payload.otp) {
      const current = await getJson(`otp:${payload.purpose}:${payload.email}`);
      const freshEnough = Date.now() - new Date(record.createdAt).getTime() < (OTP_TTL_SECONDS - 60) * 1000;
      if (!freshEnough || !current || !otpMatches(payload.otp, current.hash)) {
        await JobOutbox.updateOne({ _id: record.id, status: "sending" }, {
          $set: { status: "expired", data: {}, sentAt: new Date(), completedAt: new Date(), leaseUntil: null, lastError: "OTP expired or replaced before delivery" },
        });
        logger.warn("Expired or replaced OTP event discarded before Inngest delivery", { key: record.id });
        return true;
      }
    }
    const eventData = typeof record.data.otp === "string" ? sealOtpPayload(record.data) : record.data;
    if (eventData !== record.data) await JobOutbox.updateOne({ _id: record.id, status: "sending" }, { $set: { data: eventData } });
    await inngest.send({ id: record.id, name: record.eventName, data: eventData });
    await JobOutbox.updateOne({ _id: record.id, status: "sending" }, {
      $set: { status: "sent", data: {}, sentAt: new Date(), completedAt: new Date(), leaseUntil: null, lastError: "" },
    });
  } catch (error) {
    const delayMs = Math.min(60 * 60_000, 1000 * (2 ** Math.min(record.attempts, 12)));
    await JobOutbox.updateOne({ _id: record.id, status: "sending" }, {
      $set: {
        status: "pending",
        nextAttemptAt: new Date(Date.now() + delayMs),
        leaseUntil: null,
        lastError: String(error?.message || error).slice(0, 1000),
      },
    });
    logger.error("Inngest event delivery failed; persisted event will be retried", { event: record.eventName, key: record.id, error: error?.message });
  }
  return true;
}

export async function drainOutbox() {
  if (drainRunning || !env.INNGEST_EVENT_KEY) return;
  drainRunning = true;
  try {
    while (await drainOne()) { }
  } catch (error) {
    logger.error("Could not drain Inngest outbox", error?.message || error);
  } finally {
    drainRunning = false;
  }
}

export function startOutboxPublisher() {
  if (!env.INNGEST_EVENT_KEY) return;
  outboxTimer = setInterval(() => void drainOutbox(), 10_000);
  outboxTimer.unref?.();
  void drainOutbox();
}

export async function stopOutboxPublisher() {
  if (outboxTimer) clearInterval(outboxTimer);
  outboxTimer = null;
  while (drainRunning) await new Promise((resolve) => setTimeout(resolve, 25));
}

export async function publish(name, data) {
  const payload = { ...data, idempotencyKey: data.idempotencyKey || `${name}:${Date.now()}` };
  if (env.INNGEST_EVENT_KEY) {
    try {
      await JobOutbox.updateOne(
        { _id: payload.idempotencyKey },
        { $setOnInsert: { eventName: name, data: sealOtpPayload(payload), status: "pending", nextAttemptAt: new Date() } },
        { upsert: true },
      );
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
    void drainOutbox();
    return;
  }
  if (env.NODE_ENV === "production") {
    throw new Error("INNGEST_EVENT_KEY is missing; background job cannot be queued");
  }
  const delay = name === "chat/unread.nudge" ? 15_000 : 0;
  setTimeout(() => {
    runJob(name, payload).catch((error) => logger.error("Background job failed", name, error.message));
  }, delay);
}
