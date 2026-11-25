const secretKeys = ["password", "passwordHash", "otp", "token", "authorization", "cookie", "secret"];

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, secretKeys.some((secret) => key.toLowerCase().includes(secret)) ? "[redacted]" : redact(item)]),
  );
}

function write(level, args) {
  const line = args.map((item) => (typeof item === "string" ? item : JSON.stringify(redact(item)))).join(" ");
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  sink(`${new Date().toISOString()} ${level.toUpperCase()} ${line}`);
}

export const logger = {
  info: (...args) => write("info", args),
  warn: (...args) => write("warn", args),
  error: (...args) => write("error", args),
};
