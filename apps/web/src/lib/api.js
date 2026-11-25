import { beginRequest, endRequest } from "../components/GlobalLoading.jsx";

export class ApiClientError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function readBrowserCookie(name) {
  if (typeof document === "undefined") return "";
  for (const part of document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function csrfHeaders() {
  const token = readBrowserCookie("np_csrf");
  return token ? { "X-CSRF-Token": token } : {};
}

async function ensureCsrf() {
  if (readBrowserCookie("np_csrf")) return;
  beginRequest();
  try {
    await fetch("/api/auth/csrf", { credentials: "include" });
  } finally {
    endRequest();
  }
}

async function request(path, options = {}) {
  const method = options.method || "GET";
  if (!["GET", "HEAD"].includes(method)) await ensureCsrf();
  const headers = {
    ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...csrfHeaders(),
  };
  beginRequest();
  try {
    const response = await fetch(`/api${path}`, { ...options, method, headers, credentials: "include" });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 && body.error?.code === "AUTH_EXPIRED" && !options._retry && path !== "/auth/refresh") {
      await ensureCsrf();
      const refreshed = await fetch("/api/auth/refresh", { method: "POST", credentials: "include", headers: csrfHeaders() });
      if (refreshed.ok) return request(path, { ...options, _retry: true });
    }
    if (!response.ok) {
      throw new ApiClientError(response.status, body.error?.code || "REQUEST", body.error?.message || "Request failed", body.error?.details);
    }
    return body;
  } finally {
    endRequest();
  }
}

export const api = {
  get: async (path) => (await request(path)).data,
  getPage: (path) => request(path),
  post: async (path, payload) => (await request(path, { method: "POST", body: payload ? JSON.stringify(payload) : "{}" })).data,
  patch: async (path, payload) => (await request(path, { method: "PATCH", body: JSON.stringify(payload) })).data,
  put: async (path, payload) => (await request(path, { method: "PUT", body: JSON.stringify(payload) })).data,
  del: async (path) => (await request(path, { method: "DELETE" })).data,
  async upload(folder, file) {
    const body = new FormData();
    body.append("folder", folder);
    body.append("file", file);
    return (await request("/uploads", { method: "POST", body })).data;
  },
};

export function fieldErrors(error) {
  const out = {};
  for (const issue of error?.issues || []) {
    const key = String(issue.path?.[0] || "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export function apiFieldErrors(error) {
  const fields = error?.details?.fieldErrors || {};
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, Array.isArray(value) ? value[0] : String(value)]));
}

export function imageUrl(url, width = 960) {
  if (!url || !url.includes("/upload/")) return url || "";
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}
