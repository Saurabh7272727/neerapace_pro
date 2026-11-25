import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      JWT_ACCESS_SECRET: "test-access-secret-value",
      JWT_REFRESH_SECRET: "test-refresh-secret-value",
      CLIENT_ORIGIN: "http://localhost:5173",
      COOKIE_SECURE: "false",
      MONGODB_URI: "mongodb://127.0.0.1:27017/neerapace-test",
      OTP_PEPPER: "test-otp-pepper-value",
    },
  },
});
