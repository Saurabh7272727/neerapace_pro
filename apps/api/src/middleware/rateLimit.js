import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { cacheDel, cacheIncr } from "../config/redis.js";
import { ApiError } from "../utils/ApiError.js";

class RedisRateStore {
  constructor(windowMs) {
    this.windowMs = windowMs;
    this.prefix = "";
  }

  init(options) {
    this.windowMs = options.windowMs;
    this.prefix = options.prefix ?? "";
  }

  async increment(key) {
    const totalHits = await cacheIncr(`rl:${this.prefix}${key}`, Math.ceil(this.windowMs / 1000));
    return { totalHits, resetTime: new Date(Date.now() + this.windowMs) };
  }

  async decrement() { }

  async resetKey(key) {
    await cacheDel(`rl:${this.prefix}${key}`);
  }
}

export function sensitiveLimiter(name, limit, windowMs) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: new RedisRateStore(windowMs),
    keyGenerator: (req) => `${name}:${req.user?.id || ipKeyGenerator(req)}`,
    handler: (_req, _res, next) => next(new ApiError(429, "RATE_LIMIT", "Too many requests. Try again shortly")),
    validate: { trustProxy: false, xForwardedForHeader: false },
  });
}
