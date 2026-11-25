import request from "supertest";
import { describe, expect, it } from "vitest";
import { formatRegistrationId, loginSchema } from "@neerapace/shared";
import { createApp } from "../src/app.js";
import { canDirectMessage, canMarkAttendance } from "../src/modules/chat/permissions.js";
import { checkOtp, issueOtp } from "../src/utils/otp.js";
import { sanitizePlain, sanitizeRichText } from "../src/utils/sanitize.js";

const app = createApp();

describe("shared rules", () => {
  it("formats registration ids", () => {
    expect(formatRegistrationId(2026, 7)).toBe("NEERA-2026-0007");
  });

  it("rejects a login without an email", () => {
    const parsed = loginSchema.safeParse({ email: "not-an-email", password: "secret1" });
    expect(parsed.success).toBe(false);
  });

  it("allows only authorised chat pairs", () => {
    const admin = { id: "a", role: "admin", status: "active" };
    const coach = { id: "c", role: "coach", status: "active" };
    const student = { id: "s", role: "student", status: "active" };
    const other = { id: "o", role: "student", status: "active" };
    expect(canDirectMessage({ actor: student, target: other, sharesBatch: true })).toBe(false);
    expect(canDirectMessage({ actor: coach, target: student, sharesBatch: false })).toBe(false);
    expect(canDirectMessage({ actor: coach, target: student, sharesBatch: true })).toBe(true);
    expect(canDirectMessage({ actor: student, target: admin, sharesBatch: false })).toBe(true);
    expect(canDirectMessage({ actor: admin, target: coach, sharesBatch: false })).toBe(true);
    expect(canDirectMessage({ actor: coach, target: coach, sharesBatch: false })).toBe(false);
    expect(canMarkAttendance("admin")).toBe(true);
    expect(canMarkAttendance("coach")).toBe(false);
  });
});

describe("otp store", () => {
  it("locks a code after five misses", async () => {
    const email = "lock@example.com";
    const otp = await issueOtp(email, "verify");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(checkOtp(email, "verify", "000000")).rejects.toMatchObject({ code: "OTP_INVALID" });
    }
    await expect(checkOtp(email, "verify", otp)).rejects.toMatchObject({ code: "OTP_LOCKED" });
  });

  it("accepts the issued code once", async () => {
    const email = "once@example.com";
    const otp = await issueOtp(email, "reset");
    await expect(checkOtp(email, "reset", otp)).resolves.toBe(true);
    await expect(checkOtp(email, "reset", otp)).rejects.toMatchObject({ code: "OTP_INVALID" });
  });

  it("waits before issuing another code", async () => {
    const email = "wait@example.com";
    await issueOtp(email, "verify");
    await expect(issueOtp(email, "verify")).rejects.toMatchObject({ code: "OTP_COOLDOWN" });
  });
});

describe("sanitizing", () => {
  it("strips scripts and keeps simple copy", () => {
    expect(sanitizeRichText("<script>alert(1)</script><p>Net session</p>")).toBe("<p>Net session</p>");
    expect(sanitizePlain("<b>Coach</b> Anil")).toBe("Coach Anil");
  });
});

describe("http guard rails", () => {
  it("reports dependency health without secrets", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(503);
    expect(response.body.data.ok).toBe(false);
    expect(response.body.data).not.toHaveProperty("mongoUri");
  });

  it("blocks a mutation that has no csrf token", async () => {
    const response = await request(app).post("/api/enquiries").send({ name: "A" });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF");
  });

  it("validates an enquiry after a csrf token is issued", async () => {
    const agent = request.agent(app);
    const csrf = await agent.get("/api/auth/csrf");
    expect(csrf.status).toBe(200);
    const response = await agent
      .post("/api/enquiries")
      .set("x-csrf-token", csrf.body.data.csrfToken)
      .send({ name: "A" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION");
  });
});
