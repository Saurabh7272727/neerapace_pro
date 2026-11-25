export function canDirectMessage({ actor, target, sharesBatch }) {
  if (!actor || !target) return false;
  const actorId = String(actor.id || actor._id || "");
  const targetId = String(target.id || target._id || "");
  if (!actorId || actorId === targetId) return false;
  if (target.deletedAt) return false;
  if (actor.status === "rejected" || actor.status === "suspended") return false;
  if (target.status === "suspended" || target.status === "pending_email") return false;

  if (actor.role === "admin") return true;

  const actorCanReachAdmin = actor.status === "active" || actor.status === "pending_approval";
  if (target.role === "admin" && target.status === "active" && (actor.role === "coach" || actor.role === "student")) {
    return actorCanReachAdmin;
  }

  if (actor.role === "coach" && target.role === "student") {
    return actor.status === "active" && target.status === "active" && Boolean(sharesBatch);
  }
  if (actor.role === "student" && target.role === "coach") {
    return actor.status === "active" && target.status === "active" && Boolean(sharesBatch);
  }
  return false;
}

export function canMarkAttendance(role) {
  return role === "admin";
}

export function canViewBatchAttendance(role) {
  return role === "admin" || role === "coach";
}
