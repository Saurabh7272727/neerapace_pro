import { expect, it } from "vitest";
import { homeForRole, linksFor } from "../src/lib/access.js";

it("sends each role to their own home", () => {
  expect(homeForRole("admin")).toBe("/app/admin");
  expect(homeForRole("coach")).toBe("/app/coach");
  expect(homeForRole("student")).toBe("/app/student");
});

it("hides office tools from players and coaches", () => {
  expect(linksFor("student").some((link) => link.label === "Admissions")).toBe(false);
  expect(linksFor("coach").some((link) => link.label === "Enquiries")).toBe(false);
  expect(linksFor("admin").some((link) => link.label === "Admissions")).toBe(true);
});
