export function publicUser(user) {
  return {
    id: String(user._id || user.id),
    email: user.email,
    role: user.role,
    status: user.status,
    name: user.name,
    phone: user.phone || "",
    avatarUrl: user.avatar?.url || "",
    emailVerifiedAt: user.emailVerifiedAt || null,
  };
}

export function presentProgram(program) {
  return {
    id: String(program._id),
    name: program.name,
    description: program.description,
    ageGroup: program.ageGroup,
    scheduleSummary: program.scheduleSummary,
    imageUrl: program.imageUrl || "",
    imagePublicId: program.imagePublicId || "",
    isPublished: program.isPublished,
    sortOrder: program.sortOrder,
  };
}

export function presentStudent(profile) {
  const user = profile.userId && profile.userId.name ? profile.userId : null;
  const program = profile.programId && profile.programId.name ? profile.programId : null;
  const batch = profile.batchId && profile.batchId.name ? profile.batchId : null;
  return {
    id: String(profile._id),
    userId: String(user?._id || profile.userId),
    registrationId: profile.registrationId,
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    status: user?.status || "",
    avatarUrl: user?.avatar?.url || "",
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    address: profile.address || "",
    guardianName: profile.guardianName,
    guardianPhone: profile.guardianPhone,
    guardianEmail: profile.guardianEmail || "",
    program: program ? { id: String(program._id), name: program.name } : null,
    admissionStatus: profile.admissionStatus,
    batch: batch ? { id: String(batch._id), name: batch.name, schedule: batch.schedule, status: batch.status } : null,
    reviewNote: profile.reviewNote || "",
  };
}

export function presentCoach(profile) {
  const user = profile.userId && profile.userId.name ? profile.userId : null;
  return {
    id: String(profile._id),
    userId: String(user?._id || profile.userId),
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    status: user?.status || "",
    avatarUrl: user?.avatar?.url || "",
    bio: profile.bio || "",
    specialization: profile.specialization || "",
    experienceYears: profile.experienceYears || 0,
    isPublic: profile.isPublic,
  };
}

export function presentBatch(batch, studentCount = 0) {
  return {
    id: String(batch._id),
    name: batch.name,
    schedule: batch.schedule,
    capacity: batch.capacity,
    status: batch.status,
    startDate: batch.startDate,
    endDate: batch.endDate,
    studentCount,
    program: batch.programId?.name ? { id: String(batch.programId._id), name: batch.programId.name } : { id: String(batch.programId || "") },
    coaches: (batch.coachIds || []).map((coach) =>
      coach?.name ? { id: String(coach._id), name: coach.name } : { id: String(coach) },
    ),
  };
}

export function presentMessage(message) {
  return {
    id: String(message._id),
    conversationId: String(message.conversationId),
    senderId: String(message.senderId?._id || message.senderId),
    senderName: message.senderId?.name || "",
    body: message.body || "",
    imageUrl: message.imageUrl || "",
    createdAt: message.createdAt,
  };
}
