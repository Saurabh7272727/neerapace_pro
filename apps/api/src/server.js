import { createServer } from "node:http";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { closeRedis, connectRedis } from "./config/redis.js";
import { ensureContent } from "./seed/content.js";
import { startOutboxPublisher, stopOutboxPublisher } from "./jobs/publish.js";
import { initSocket } from "./sockets/index.js";
import { getIo } from "./sockets/io.js";

if (env.NODE_ENV === "production") {
  const required = ["INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY", "ADMIN_EMAIL", "SMTP_HOST"];
  const missing = required.filter((key) => !env[key]);
  if (missing.length) throw new Error(`Missing production integrations: ${missing.join(", ")}`);
}
if (env.GOOGLE_SSO_ENABLED === "true") {
  const missingGoogle = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"].filter((key) => !env[key]);
  if (missingGoogle.length) throw new Error(`Google sign-in is enabled but missing: ${missingGoogle.join(", ")}`);
}

const app = createApp();
const server = createServer(app);
initSocket(server);

await connectDb();
await connectRedis();
await ensureContent();
startOutboxPublisher();

server.listen(env.PORT, () => logger.info(`API listening on ${env.PORT}`));

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await new Promise((resolve) => {
    const io = getIo();
    if (io) io.close(resolve);
    else server.close(resolve);
  });
  await stopOutboxPublisher();
  await mongoose.disconnect();
  await closeRedis();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
