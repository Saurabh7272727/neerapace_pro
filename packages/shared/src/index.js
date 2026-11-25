export * from "./constants.js";
export * from "./schemas.js";

export function formatRegistrationId(year, seq) {
  return `NEERA-${year}-${String(seq).padStart(4, "0")}`;
}

export function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}
