import { ApiError } from "../utils/ApiError.js";

export function validateBody(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(new ApiError(400, "VALIDATION", "Check the highlighted fields", parsed.error.flatten()));
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      next(new ApiError(400, "VALIDATION", "Check the query parameters", parsed.error.flatten()));
      return;
    }
    req.query = parsed.data;
    next();
  };
}
