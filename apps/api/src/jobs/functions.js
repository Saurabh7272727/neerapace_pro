import { inngest } from "./client.js";
import { runJob } from "./deliver.js";

function emailFunction(id, eventName) {
  return inngest.createFunction(
    { id, retries: 4, idempotency: "event.data.idempotencyKey" },
    { event: eventName },
    async ({ event }) => runJob(eventName, event.data),
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
    await runJob("chat/unread.nudge", event.data);
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
];
