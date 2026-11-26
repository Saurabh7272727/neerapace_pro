import { inngest } from "./client.js";
import { runJob } from "./deliver.js";
import { sendAdminEmail } from "../config/mail.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

function escapeHtml(value) {
  return String(value || "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" })[char]);
}

function summarizeFailure(event) {
  const error = event.data?.error || {};
  const original = event.data?.event || {};
  const referenceFields = ["userId", "recipientId", "announcementId", "messageId", "conversationId", "registrationId"];
  const references = Object.fromEntries(referenceFields
    .filter((key) => original.data?.[key] != null)
    .map((key) => [key, String(original.data[key]).slice(0, 160)]));
  return {
    functionId: String(event.data?.function_id || "unknown").slice(0, 160),
    runId: String(event.data?.run_id || "unknown").slice(0, 160),
    eventName: String(original.name || "unknown").slice(0, 160),
    errorName: String(error.name || "Error").slice(0, 120),
    errorMessage: String(error.message || "No error message was provided").slice(0, 2000),
    references: JSON.stringify(references),
  };
}

export const reportJobFailure = inngest.createFunction(
  { id: "admin-job-failure-email", retries: 3 },
  { event: "inngest/function.failed" },
  async ({ event, step }) => {
    if (event.data?.function_id === "admin-job-failure-email") return { skipped: "failure reporter" };
    if (!env.ADMIN_EMAIL) {
      logger.error("Cannot email Inngest failure: ADMIN_EMAIL is not configured", summarizeFailure(event));
      return { skipped: "admin email missing" };
    }

    const failure = summarizeFailure(event);
    const subject = `[Neera Pace] Background job failed: ${failure.functionId}`;
    const rows = Object.entries(failure).map(([key, value]) => `<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</p>`).join("");
    const text = [
      "A Neera Pace background job failed after Inngest retries.",
      ...Object.entries(failure).map(([key, value]) => `${key}: ${value}`),
      "Inspect the matching run in the Inngest dashboard and use its event references to locate related database records.",
    ].join("\n");

    await step.run("email-admin-about-failed-job", async () => {
      const result = await sendAdminEmail({
        to: env.ADMIN_EMAIL,
        subject,
        text,
        html: `<h2>Background job failed</h2><p>A job exhausted its configured Inngest retries.</p>${rows}<p>Inspect this run in the Inngest dashboard and use its event references to locate related database records.</p>`,
      });
      if (result.skipped) throw new Error("SMTP is not configured; failure alert was not sent");
      return { messageId: result.messageId };
    });
    return { sent: true };
  },
);

function emailFunction(id, eventName) {
  return inngest.createFunction(
    { id, retries: 4, idempotency: "event.data.idempotencyKey" },
    { event: eventName },
    async ({ event, step }) => step.run("deliver-job", async () => {
      await runJob(eventName, event.data);
      return { delivered: true };
    }),
  );
}

export const unreadNudge = inngest.createFunction(
  {
    id: "chat-unread-nudge",
    retries: 3,
    idempotency: "event.data.idempotencyKey",
  },
  { event: "chat/unread.nudge" },
  async ({ event, step }) => {
    await step.sleep("wait-for-read", "15m");
    await step.run("deliver-unread-nudge", async () => {
      await runJob("chat/unread.nudge", event.data);
      return { delivered: true };
    });
  },
);

export const functions = [
  emailFunction("send-otp-email", "auth/otp.requested"),
  emailFunction("send-password-reset-email", "auth/password-reset.requested"),
  emailFunction("admission-submitted-email", "admission/submitted"),
  emailFunction("admission-decided-email", "admission/decided"),
  emailFunction("announcement-email", "announcement/published"),
  emailFunction("notification-email", "notification/email"),
  unreadNudge,
  reportJobFailure,
];
