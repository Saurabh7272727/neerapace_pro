import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

const memory = new Map();
let client = null;
let mode = "memory";

function readMemory(key) {
  const row = memory.get(key);
  if (!row) return null;
  if (row.expiresAt && Date.now() > row.expiresAt) {
    memory.delete(key);
    return null;
  }
  return row.value;
}

export async function connectRedis() {
  if (!env.REDIS_URL) {
    if (env.NODE_ENV === "production") {
      throw new Error("REDIS_URL is required in production");
    }
    mode = "memory";
    logger.warn("REDIS_URL is not set. Using an in-memory store outside production.");
    return;
  }
  client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: true });
  client.on("error", (error) => logger.error("Redis error", error.message));
  await client.connect();
  await client.ping();
  mode = "redis";
  logger.info("Redis connected");
}

export function getRedis() {
  return client;
}

export function redisMode() {
  return mode;
}

export async function pingRedis() {
  if (mode === "redis" && client) {
    const reply = await client.ping();
    return reply === "PONG";
  }
  return mode === "memory" && env.NODE_ENV !== "production";
}

export async function cacheGet(key) {
  if (mode === "redis" && client) return client.get(key);
  return readMemory(key);
}

export async function cacheSet(key, value, ttlSeconds) {
  if (mode === "redis" && client) {
    await client.set(key, value, "EX", ttlSeconds);
    return;
  }
  memory.set(key, { value: String(value), expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(...keys) {
  const present = keys.filter(Boolean);
  if (!present.length) return;
  if (mode === "redis" && client) {
    await client.del(...present);
    return;
  }
  present.forEach((key) => memory.delete(key));
}

export async function cacheIncr(key, ttlSeconds) {
  if (mode === "redis" && client) {
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, ttlSeconds);
    return count;
  }
  const row = memory.get(key);
  const expired = !row || (row.expiresAt && Date.now() > row.expiresAt);
  const count = expired ? 1 : Number(row.value) + 1;
  memory.set(key, {
    value: String(count),
    expiresAt: expired ? Date.now() + ttlSeconds * 1000 : row.expiresAt,
  });
  return count;
}

export async function putJson(key, value, ttlSeconds) {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
}

export async function getJson(key) {
  const raw = await cacheGet(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function cacheAside(key, ttlSeconds, loader) {
  try {
    const hit = await cacheGet(key);
    if (hit) return JSON.parse(hit);
  } catch (error) {
    logger.warn("Cache read failed", error.message);
  }
  const value = await loader();
  try {
    await cacheSet(key, JSON.stringify(value), ttlSeconds);
  } catch (error) {
    logger.warn("Cache write failed", error.message);
  }
  return value;
}

export async function closeRedis() {
  if (client) await client.quit();
  client = null;
  mode = "memory";
  memory.clear();
}
