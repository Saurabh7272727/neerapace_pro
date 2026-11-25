import { LOGIN_STATUSES } from "@neerapace/shared";
import { User } from "../models/index.js";
import { verifyAccess } from "../utils/tokens.js";
import { ApiError } from "../utils/ApiError.js";

export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.np_access;
    if (!token) throw new ApiError(401, "AUTH_REQUIRED", "Sign in required");
    let payload;
    try {
      payload = verifyAccess(token);
    } catch (error) {
      if (error.name === "TokenExpiredError") throw new ApiError(401, "AUTH_EXPIRED", "Session expired");
      throw new ApiError(401, "AUTH_REQUIRED", "Sign in required");
    }
    const user = await User.findOne({ _id: payload.sub, deletedAt: null }).select("-passwordHash");
    if (!user || !LOGIN_STATUSES.includes(user.status)) {
      throw new ApiError(401, "AUTH_REQUIRED", "Sign in required");
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ApiError(403, "FORBIDDEN", "You do not have access to this resource"));
      return;
    }
    next();
  };
}

export function requireActive(req, _res, next) {
  if (req.user?.status !== "active") {
    next(new ApiError(403, "ACCOUNT_INACTIVE", "This action is available after the academy approves the account"));
    return;
  }
  next();
}
