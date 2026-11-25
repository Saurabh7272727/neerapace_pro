import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { serve } from "inngest/express";
import { mongoReady } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { pingRedis } from "./config/redis.js";
import { inngest } from "./jobs/client.js";
import { functions } from "./jobs/functions.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler, notFound } from "./middleware/error.js";
import api from "./routes/index.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    const started = Date.now();
    res.on("finish", () => {
      if (req.path === "/api/health") return;
      logger.info(req.method, req.originalUrl, String(res.statusCode), `${Date.now() - started}ms`);
    });
    next();
  });

  app.use("/api/inngest", serve({ client: inngest, functions }));

  const httpApi = express.Router();
  httpApi.use(express.json({ limit: "1mb" }));
  httpApi.get("/health", async (_req, res) => {
    const mongo = mongoReady();
    let redis = false;
    try {
      redis = await pingRedis();
    } catch {
      redis = false;
    }
    const ok = mongo && (env.NODE_ENV !== "production" || redis);
    res.status(ok ? 200 : 503).json({ data: { ok, mongo, redis } });
  });
  httpApi.use(csrfProtection);
  httpApi.use(api);
  app.use("/api", httpApi);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
