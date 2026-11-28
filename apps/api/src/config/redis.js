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

export async function cacheGetDel(key) {
  if (mode === "redis" && client) {
    return client.eval(
      "local value = redis.call('GET', KEYS[1]); if value then redis.call('DEL', KEYS[1]); end; return value",
      1,
      key,
    );
  }
  const value = readMemory(key);
  memory.delete(key);
  return value;
}

// Atomically count OTP failures and consume a matching code. Keeping this in
// the shared cache prevents parallel requests from bypassing the attempt cap.
export async function cacheVerifyAndConsumeOtp(key, candidateHash, maxAttempts) {
  if (mode === "redis" && client) {
    return Number(await client.eval(
      `local raw = redis.call('GET', KEYS[1]);
      if not raw then return 0 end
      local record = cjson.decode(raw)
      if record.attempts >= tonumber(ARGV[2]) then return -1 end
      if record.hash ~= ARGV[1] then
        record.attempts = record.attempts + 1
        local ttl = redis.call('PTTL', KEYS[1])
        if ttl >= 0 then redis.call('SET', KEYS[1], cjson.encode(record), 'PX', math.max(ttl, 1)) else redis.call('SET', KEYS[1], cjson.encode(record)) end
        return 1
      end
      redis.call('DEL', KEYS[1])
      return 2`,
      1,
      key,
      candidateHash,
      maxAttempts,
    ));
  }

  const raw = readMemory(key);
  if (!raw) return 0;
  const record = JSON.parse(raw);
  if (record.attempts >= maxAttempts) return -1;
  if (record.hash !== candidateHash) {
    record.attempts += 1;
    const row = memory.get(key);
    memory.set(key, { ...row, value: JSON.stringify(record) });
    return 1;
  }
  memory.delete(key);
  return 2;
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
    return Number(await client.eval(
      "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return count",
      1,
      key,
      ttlSeconds,
    ));
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
