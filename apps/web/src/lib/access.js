export function homeForRole(role) {
  if (role === "admin") return "/app/admin";
  if (role === "coach") return "/app/coach";
  if (role === "student") return "/app/student";
  return "/";
}

export function linksFor(role) {
  const announcements = { to: "/app/announcements", label: "Announcements" };
  const messages = { to: "/app/chat", label: "Messages" };
  const notifications = { to: "/app/notifications", label: "Notifications" };
  if (role === "admin") {
    return [
      { to: "/app/admin", label: "Overview" },
      { to: "/app/admissions", label: "Admissions" },
      { to: "/app/students", label: "Students" },
      { to: "/app/coaches", label: "Coaches" },
      { to: "/app/programs", label: "Programs" },
      { to: "/app/batches", label: "Batches" },
      { to: "/app/attendance", label: "Attendance" },
      announcements,
      { to: "/app/enquiries", label: "Enquiries" },
      { to: "/app/content", label: "Website" },
      { to: "/app/gallery", label: "Gallery" },
      messages,
      notifications,
    ];
  }
  if (role === "coach") {
    return [
      { to: "/app/coach", label: "Overview" },
      { to: "/app/batches", label: "My batches" },
      { to: "/app/students", label: "Students" },
      { to: "/app/attendance", label: "Attendance" },
      announcements,
      messages,
      notifications,
    ];
  }
  return [
    { to: "/app/student", label: "Overview" },
    { to: "/app/batches", label: "My batch" },
    { to: "/app/attendance", label: "Attendance" },
    announcements,
    messages,
    notifications,
  ];
}
