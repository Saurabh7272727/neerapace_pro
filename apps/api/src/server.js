import { createServer } from "node:http";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { closeRedis, connectRedis } from "./config/redis.js";
import { ensureContent } from "./seed/content.js";
import { initSocket } from "./sockets/index.js";

const app = createApp();
const server = createServer(app);
initSocket(server);

await connectDb();
await connectRedis();
await ensureContent();

server.listen(env.PORT, () => logger.info(`API listening on ${env.PORT}`));

async function shutdown() {
  server.close();
  await mongoose.disconnect();
  await closeRedis();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
