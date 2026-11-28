import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { announcementSchema, bannerSchema, batchSchema, coachCreateSchema, coachUpdateSchema, gallerySchema, pageSchema, programSchema, registerSchema, studentUpdateSchema } from "@neerapace/shared";
import { Badge, Button, Empty, ErrorNote, Field, Modal, PageTitle, Spinner, inputClass } from "../../components/ui.jsx";
import { ImagePicker } from "../../components/ImagePicker.jsx";
import { useSession } from "../../hooks/useSession.js";
import { api, fieldErrors, imageUrl } from "../../lib/api.js";
import { StudentContactActions } from "./StudentContactActions.jsx";
import { StudentDetailGrid, StudentDetailPortal } from "./StudentDetailPortal.jsx";

function useInvalidate(keys) {
  const queryClient = useQueryClient();
  return () => keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

function bannerErrorMessage(error, action = "complete this action") {
  if (error?.code === "BANNER_LIMIT") return error.message;
  if (error?.code === "UPLOADS_UNAVAILABLE") return "Photo uploads are not configured right now. Contact the site administrator.";
  if (error?.status === 401) return "Your admin session expired. Sign in again and retry.";
  if (error?.status === 403) return "Admin access is required to manage homepage banners.";
  if (error?.status === 0 || error instanceof TypeError) return `Couldn't ${action} because the server couldn't be reached. Check your connection and retry.`;
  if (error?.status >= 500) return `Couldn't ${action} right now. Please retry in a moment.`;
  return error?.message || `Couldn't ${action}. Please check the details and retry.`;
}

export function StudentsPage() {
  const session = useSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const students = useQuery({ queryKey: ["students", page, search, session.data?.role], queryFn: () => api.getPage(`/students?${new URLSearchParams({ page: String(page), limit: "30", ...(search ? { q: search } : {}) })}`) });
  const programs = useQuery({ queryKey: ["programs-all"], queryFn: () => api.get("/programs/all"), enabled: session.data?.role === "admin" });
  const refresh = useInvalidate(["students", "stats"]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const admin = session.data?.role === "admin";
  const rows = students.data?.data || [];
  const selectedStudent = admin ? rows.find((student) => student.userId === selectedStudentId) : null;

  async function createStudent(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    try {
      await api.post("/students", parsed.data);
      setOpen(false);
      setError(null);
      setErrors({});
      refresh();
    } catch (err) {
      setError(err);
    }
  }

  async function removeStudent(userId) {
    if (!window.confirm("Permanently delete this student and their profile, attendance, notifications and chat data? This cannot be undone.")) return;
    try {
      await api.del(`/students/${userId}`);
      setSelectedStudentId("");
      refresh();
    } catch (err) {
      setError(err);
    }
  }

  async function changeStudentStatus(student, status) {
    const message = status === "suspended"
      ? `Suspend ${student.name}'s access? Their current sessions will end immediately.`
      : `Reactivate ${student.name}'s account? They will be able to sign in again.`;
    if (!window.confirm(message)) return;
    setError(null);
    try {
      await api.patch(`/users/${student.userId}/status`, { status });
      refresh();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <section>
      <PageTitle title="Students" />
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-4xl text-pitch">{session.data?.role === "coach" ? "Assigned players" : "Players"}</h1>
        {admin ? <Button onClick={() => setOpen(true)}>Add player</Button> : null}
      </div>
      <ErrorNote error={error} />
      {admin ? <input className={`${inputClass} mt-4 max-w-md`} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); setSelectedStudentId(""); }} placeholder="Search players" aria-label="Search players" /> : null}
      {students.isLoading ? <Spinner /> : null}
      {selectedStudent ? (
        <section className="hidden" aria-labelledby="selected-student-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-fairway">Student details</p>
              <h2 id="selected-student-heading" className="mt-1 text-2xl font-bold text-pitch">{selectedStudent.name}</h2>
              <p className="mt-1 text-sm text-ink/70">Registration: {selectedStudent.registrationId || "—"}</p>
            </div>
            <Button variant="ghost" onClick={() => setSelectedStudentId("")}>Close details</Button>
          </div>
          <dl className="my-5 grid gap-x-6 gap-y-4 rounded-2xl bg-cream/50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="font-semibold text-ink/60">Email</dt><dd className="break-all">{selectedStudent.email || "Not provided"}</dd></div>
            <div><dt className="font-semibold text-ink/60">Phone</dt><dd>{selectedStudent.phone || "Not provided"}</dd></div>
            <div><dt className="font-semibold text-ink/60">Date of birth</dt><dd>{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : "Not provided"}</dd></div>
            <div><dt className="font-semibold text-ink/60">Gender</dt><dd>{selectedStudent.gender || "Not provided"}</dd></div>
            <div><dt className="font-semibold text-ink/60">Program</dt><dd>{selectedStudent.program?.name || "—"}</dd></div>
            <div><dt className="font-semibold text-ink/60">Batch</dt><dd>{selectedStudent.batch?.name || "Not assigned"}</dd></div>
            <div><dt className="font-semibold text-ink/60">Address</dt><dd className="break-words">{selectedStudent.address || "Not provided"}</dd></div>
            <div><dt className="font-semibold text-ink/60">Guardian</dt><dd>{selectedStudent.guardianName || "Not provided"}</dd></div>
            <div><dt className="font-semibold text-ink/60">Guardian phone</dt><dd>{selectedStudent.guardianPhone || "Not provided"}</dd></div>
            <div><dt className="font-semibold text-ink/60">Guardian email</dt><dd className="break-all">{selectedStudent.guardianEmail || "Not provided"}</dd></div>
            <div><dt className="font-semibold text-ink/60">Account status</dt><dd>{selectedStudent.status || "—"}</dd></div>
            <div><dt className="font-semibold text-ink/60">Admission status</dt><dd>{selectedStudent.admissionStatus || "—"}</dd></div>
          </dl>
          <StudentContactActions student={selectedStudent} />
        </section>
      ) : null}
      <StudentDetailPortal
        open={Boolean(selectedStudent)}
        title={selectedStudent?.name || "Student details"}
        eyebrow={selectedStudent?.registrationId || "Student record"}
        onClose={() => setSelectedStudentId("")}
        footer={selectedStudent ? <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
          {selectedStudent.status === "active" ? <Button variant="danger" onClick={() => changeStudentStatus(selectedStudent, "suspended")}>Suspend access</Button> : null}
          {selectedStudent.status === "suspended" ? <Button variant="gold" onClick={() => changeStudentStatus(selectedStudent, "active")}>Reactivate account</Button> : null}
          <Button variant="danger" onClick={() => removeStudent(selectedStudent.userId)}>Permanently delete</Button>
        </div> : null}
      >
        {selectedStudent ? <>
          <ErrorNote error={error} />
          <StudentDetailGrid fields={[
            ["Email", selectedStudent.email],
            ["Phone", selectedStudent.phone],
            ["Date of birth", selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : "Not provided"],
            ["Gender", selectedStudent.gender],
            ["Program", selectedStudent.program?.name],
            ["Batch", selectedStudent.batch?.name || "Not assigned"],
            ["Home address", selectedStudent.address],
            ["Guardian", selectedStudent.guardianName],
            ["Guardian phone", selectedStudent.guardianPhone],
            ["Guardian email", selectedStudent.guardianEmail],
            ["Account status", selectedStudent.status],
            ["Admission status", selectedStudent.admissionStatus],
          ]} />
          <div className="mt-5"><StudentContactActions student={selectedStudent} /></div>
        </> : null}
      </StudentDetailPortal>
      <div className="mt-6 space-y-3">
        {rows.map((student) => (
          <article key={student.userId} className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_auto] sm:items-center ${student.userId === selectedStudentId ? "border-pitch bg-cream/30" : "border-line bg-paper"}`}>
            {admin ? (
              <button type="button" aria-haspopup="dialog" onClick={() => { setError(null); setSelectedStudentId(student.userId); }} className="min-w-0 rounded-xl p-2 text-left transition hover:bg-cream/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pitch">
                <span className="block text-lg font-semibold text-pitch">{student.name}</span>
                <span className="mt-1 block break-all text-sm text-ink/70">{student.email || "No email provided"}</span>
                <span className="mt-2 inline-flex"><Badge tone={student.status === "active" ? "pitch" : "gold"}>{student.status || "Unknown status"}</Badge></span>
                <span className="mt-2 block text-sm text-ink/65">{student.program?.name || "No program"}</span>
                <span className="hidden">
                  <span>Registration: {student.registrationId || "—"}</span>
                  <span>Program: {student.program?.name || "—"}</span>
                  <span>Batch: {student.batch?.name || "Not assigned"}</span>
                  <span>Status: {student.status || "—"}</span>
                </span>
                <span className="mt-2 block text-xs font-semibold text-fairway">View full details</span>
              </button>
            ) : (
              <div className="min-w-0 p-1">
                <p className="text-lg font-semibold text-pitch">{student.name}</p>
                <p className="mt-1 break-all text-sm text-ink/70">{student.email || "No email provided"}</p>
                <p className="mt-3 text-sm text-ink/70">Registration: {student.registrationId || "—"} · Program: {student.program?.name || "—"} · Batch: {student.batch?.name || "Not assigned"}</p>
              </div>
            )}
            {admin ? <Button variant="ghost" className="border border-line sm:justify-self-end" onClick={() => setSelectedStudentId(student.userId)}>Manage access</Button> : null}
          </article>
        ))}
      </div>
      {!rows.length && !students.isLoading ? <div className="mt-6"><Empty title="No players" body="Student accounts and applications appear here, including applicants waiting to verify their email." /></div> : null}
      {admin && students.data?.meta ? <div className="mt-4 flex items-center justify-between text-sm"><span>{students.data.meta.total} players · page {page}</span><div className="flex gap-2"><Button variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="ghost" disabled={page * students.data.meta.limit >= students.data.meta.total} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div> : null}
      <Modal open={open} title="Add player" onClose={() => setOpen(false)}>
        <form className="grid gap-3" onSubmit={createStudent}>
          {[["name", "Player name", "text"], ["email", "Email", "email"], ["phone", "Phone", "text"], ["password", "Password", "password"], ["dateOfBirth", "Date of birth", "date"], ["address", "Address", "text"], ["guardianName", "Guardian name", "text"], ["guardianPhone", "Guardian phone", "text"], ["guardianEmail", "Guardian email", "email"]].map(([name, label, type]) => (
            <Field key={name} label={label} error={errors[name]}><input className={inputClass} name={name} type={type} /></Field>
          ))}
          <Field label="Gender" error={errors.gender}><select className={inputClass} name="gender" defaultValue=""><option value="" disabled>Choose</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></Field>
          <Field label="Program" error={errors.programId}><select className={inputClass} name="programId" defaultValue=""><option value="" disabled>Choose</option>{(programs.data || []).map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></Field>
          <ErrorNote error={error} /><Button type="submit">Create player</Button>
        </form>
      </Modal>
    </section>
  );
}

export function CoachesAdminPage() {
  const coaches = useQuery({ queryKey: ["coaches-manage"], queryFn: () => api.get("/coaches/manage") });
  const refresh = useInvalidate(["coaches-manage", "coaches"]);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  async function onSubmit(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.experienceYears = Number(payload.experienceYears || 0);
    payload.isPublic = payload.isPublic === "on";
    const parsed = coachCreateSchema.safeParse(payload);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    try {
      await api.post("/coaches", parsed.data);
      setOpen(false);
      refresh();
    } catch (err) {
      setError(err);
    }
  }
  return (
    <section>
      <PageTitle title="Coaches" />
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-4xl text-pitch">Coaches</h1>
        <Button onClick={() => setOpen(true)}>Add coach</Button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(coaches.data || []).map((coach) => (
          <article key={coach.id} className="rounded-3xl border border-line bg-paper p-5">
            <h2 className="font-serif text-2xl text-pitch">{coach.name}</h2>
            <p className="text-sm">{coach.email}</p>
            <p className="mt-2 text-sm text-ink/70">{coach.specialization || "General coaching"} · {coach.experienceYears} years</p>
            <Badge tone={coach.isPublic ? "gold" : "clay"}>{coach.isPublic ? "On the website" : "Hidden"}</Badge>
            {coach.status === "active" ? <div className="mt-3"><Button variant="danger" onClick={async () => { if (window.confirm("Remove this coach?")) { try { await api.del(`/coaches/${coach.userId}`); refresh(); } catch (err) { setError(err); } } }}>Remove coach</Button></div> : null}
          </article>
        ))}
      </div>
      <Modal open={open} title="New coach" onClose={() => setOpen(false)}>
        <form className="grid gap-3" onSubmit={onSubmit}>
          {["name", "email", "phone", "password", "specialization", "bio"].map((name) => (
            <Field key={name} label={name} error={errors[name]}><input className={inputClass} name={name} type={name === "password" ? "password" : "text"} /></Field>
          ))}
          <Field label="Years"><input className={inputClass} name="experienceYears" type="number" defaultValue="0" /></Field>
          <label className="text-sm"><input name="isPublic" type="checkbox" defaultChecked /> Show on the public coaches page</label>
          <ErrorNote error={error} />
          <Button type="submit">Create coach</Button>
        </form>
      </Modal>
    </section>
  );
}

export function BatchesPage() {
  const session = useSession();
  const batches = useQuery({ queryKey: ["batches"], queryFn: () => api.get("/batches") });
  const programs = useQuery({ queryKey: ["programs"], queryFn: () => api.get("/programs"), enabled: session.data?.role === "admin" });
  const coaches = useQuery({ queryKey: ["coaches-manage"], queryFn: () => api.get("/coaches/manage"), enabled: session.data?.role === "admin" });
  const students = useQuery({ queryKey: ["approved-students"], queryFn: () => api.get("/students?status=approved"), enabled: session.data?.role === "admin" });
  const refresh = useInvalidate(["batches", "students", "stats"]);
  const [error, setError] = useState(null);
  const admin = session.data?.role === "admin";

  async function createBatch(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.capacity = Number(payload.capacity);
    const parsed = batchSchema.safeParse(payload);
    if (!parsed.success) return setError({ message: "Check the batch dates, program and capacity." });
    try {
      await api.post("/batches", parsed.data);
      event.currentTarget.reset();
      setError(null);
      refresh();
    } catch (err) {
      setError(err);
    }
  }

  async function assign(batchId, kind, userId) {
    if (!userId) return;
    try {
      await api.post(`/batches/${batchId}/${kind}`, { userId });
      refresh();
      setError(null);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <section>
      <PageTitle title="Batches" />
      <h1 className="font-serif text-4xl text-pitch">{admin ? "Batches" : "My batch"}</h1>
      <ErrorNote error={error} />
      {admin ? (
        <form className="mt-6 grid gap-3 rounded-3xl border border-line bg-paper p-5" onSubmit={createBatch}>
          <Field label="Name"><input className={inputClass} name="name" required /></Field>
          <Field label="Program">
            <select className={inputClass} name="programId" required defaultValue="">
              <option value="" disabled>Choose</option>
              {(programs.data || []).map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
            </select>
          </Field>
          <Field label="Schedule"><input className={inputClass} name="schedule" placeholder="Tue/Thu 16:00" required /></Field>
          <Field label="Capacity"><input className={inputClass} name="capacity" type="number" min="1" defaultValue="16" /></Field>
          <Field label="Starts"><input className={inputClass} name="startDate" type="date" required /></Field>
          <Field label="Ends"><input className={inputClass} name="endDate" type="date" required /></Field>
          <Field label="Status">
            <select className={inputClass} name="status" defaultValue="upcoming">
              <option value="upcoming">upcoming</option>
              <option value="active">active</option>
              <option value="completed">completed</option>
            </select>
          </Field>
          <div className="self-end"><Button type="submit">Create batch</Button></div>
        </form>
      ) : null}
      <div className="mt-6 space-y-4">
        {(batches.data || []).map((batch) => (
          <article key={batch.id} className="rounded-3xl border border-line bg-paper p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-2xl text-pitch">{batch.name}</h2>
              <Badge>{batch.status}</Badge>
            </div>
            <p className="mt-2 text-sm">{batch.program?.name} · {batch.schedule}</p>
            <p className="text-sm text-ink/70">{batch.studentCount}/{batch.capacity} players · {batch.startDate} to {batch.endDate}</p>
            <p className="text-sm">Coaches: {batch.coaches.map((coach) => coach.name).join(", ") || "None yet"}</p>
            {admin ? (
              <>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <select className={inputClass} defaultValue="" onChange={(event) => assign(batch.id, "coaches", event.target.value)}>
                    <option value="">Assign a coach</option>
                    {(coaches.data || []).map((coach) => <option key={coach.userId} value={coach.userId}>{coach.name}</option>)}
                  </select>
                  <select className={inputClass} defaultValue="" onChange={(event) => assign(batch.id, "students", event.target.value)}>
                    <option value="">Assign a player</option>
                    {(students.data || []).map((student) => <option key={student.userId} value={student.userId}>{student.name} · {student.registrationId}</option>)}
                  </select>
                </div>
                <div className="mt-3"><Button variant="danger" onClick={async () => { if (window.confirm("Remove this batch?")) { try { await api.del(`/batches/${batch.id}`); refresh(); } catch (err) { setError(err); } } }}>Remove batch</Button></div>
              </>
            ) : null}
          </article>
        ))}
      </div>
      {!batches.data?.length && !batches.isLoading ? <div className="mt-6"><Empty title="No batch" body="The office creates a batch and then assigns people to it." /></div> : null}
    </section>
  );
}

export function AttendancePage() {
  const session = useSession();
  const batches = useQuery({ queryKey: ["batches"], queryFn: () => api.get("/batches"), enabled: session.data?.role !== "student" });
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState({});
  const [error, setError] = useState(null);
  const roster = useQuery({
    queryKey: ["roster", batchId],
    queryFn: () => api.get(`/batches/${batchId}/roster`),
    enabled: Boolean(batchId) && session.data?.role !== "student",
  });
  const records = useQuery({
    queryKey: ["attendance", batchId, date, session.data?.role],
    queryFn: () => api.get(session.data?.role === "student" ? "/attendance" : `/attendance?batchId=${batchId}&date=${date}`),
    enabled: session.data?.role === "student" || Boolean(batchId),
  });

  async function save() {
    const rows = (roster.data || []).map((student) => ({ studentId: student.userId, status: marks[student.userId] || "present" }));
    try {
      await api.put("/attendance", { batchId, date, records: rows });
      records.refetch();
      setError(null);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <section>
      <PageTitle title="Attendance" />
      <h1 className="font-serif text-4xl text-pitch">Attendance</h1>
      {session.data?.role === "student" ? (
        <div className="mt-6 space-y-2">
          {(records.data || []).map((row) => <p key={row.id} className="rounded-2xl bg-paper px-4 py-3 text-sm">{row.date} · {row.status}</p>)}
          {!records.data?.length ? <Empty title="No attendance yet" /> : null}
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-3">
            <select className={inputClass + " max-w-xs"} value={batchId} onChange={(event) => setBatchId(event.target.value)}>
              <option value="">Choose a batch</option>
              {(batches.data || []).map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
            </select>
            <input className={inputClass + " max-w-xs"} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <ErrorNote error={error} />
          {session.data?.role === "coach" ? (
            <div className="mt-4 space-y-2">
              {(records.data || []).map((row) => <p key={row.id} className="text-sm">{row.studentName} · {row.status}</p>)}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {(roster.data || []).map((student) => (
                <label key={student.userId} className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3 text-sm">
                  <span>{student.name} · {student.registrationId}</span>
                  <select className={inputClass + " max-w-36"} value={marks[student.userId] || "present"} onChange={(event) => setMarks((current) => ({ ...current, [student.userId]: event.target.value }))}>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="leave">Leave</option>
                  </select>
                </label>
              ))}
              {roster.data?.length ? <Button onClick={save}>Save attendance</Button> : null}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function AnnouncementsPage() {
  const session = useSession();
  const items = useQuery({ queryKey: ["announcements"], queryFn: () => api.get("/announcements") });
  const batches = useQuery({ queryKey: ["batches"], queryFn: () => api.get("/batches"), enabled: session.data?.role === "admin" });
  const refresh = useInvalidate(["announcements", "public-announcements"]);
  const [error, setError] = useState(null);
  async function publish(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.publish = true;
    if (!payload.batchId) delete payload.batchId;
    const parsed = announcementSchema.safeParse(payload);
    if (!parsed.success) return setError({ message: "Add a title, a message, and a batch when the audience is one squad." });
    try {
      await api.post("/announcements", parsed.data);
      event.currentTarget.reset();
      refresh();
      setError(null);
    } catch (err) {
      setError(err);
    }
  }
  return (
    <section>
      <PageTitle title="Announcements" />
      <h1 className="font-serif text-4xl text-pitch">Announcements</h1>
      {session.data?.role === "admin" ? (
        <form className="mt-6 grid gap-3 rounded-3xl border border-line bg-paper p-5" onSubmit={publish}>
          <Field label="Title"><input className={inputClass} name="title" /></Field>
          <Field label="Message"><textarea className={inputClass} name="body" rows={4} /></Field>
          <Field label="Audience">
            <select className={inputClass} name="audience" defaultValue="all">
              <option value="all">Everyone</option>
              <option value="students">Players</option>
              <option value="coaches">Coaches</option>
              <option value="batch">One batch</option>
            </select>
          </Field>
          <Field label="Batch, if needed">
            <select className={inputClass} name="batchId" defaultValue="">
              <option value="">None</option>
              {(batches.data || []).map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
            </select>
          </Field>
          <ErrorNote error={error} />
          <Button type="submit">Publish</Button>
        </form>
      ) : null}
      <div className="mt-6 space-y-3">
        {(items.data || []).map((item) => (
          <article key={item.id} className="rounded-3xl border border-line bg-paper p-5">
            <h2 className="font-serif text-2xl text-pitch">{item.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm">{item.body}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-ink/50">{item.audience} {item.publishedAt ? "" : "· draft"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function EnquiriesPage() {
  const enquiries = useQuery({ queryKey: ["enquiries"], queryFn: () => api.get("/enquiries") });
  const refresh = useInvalidate(["enquiries", "stats"]);
  return (
    <section>
      <PageTitle title="Enquiries" />
      <h1 className="font-serif text-4xl text-pitch">Enquiries</h1>
      <div className="mt-6 space-y-3">
        {(enquiries.data || []).map((item) => (
          <article key={item.id} className="rounded-3xl border border-line bg-paper p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-2xl">{item.name}</h2>
              <Badge>{item.status}</Badge>
            </div>
            <p className="text-sm">{item.email} {item.phone}</p>
            <p className="mt-2 text-sm">{item.message}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" onClick={() => api.patch(`/enquiries/${item.id}`, { status: "read" }).then(refresh)}>Mark read</Button>
              <Button variant="ghost" onClick={() => api.patch(`/enquiries/${item.id}`, { status: "closed" }).then(refresh)}>Close</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ContentPage() {
  const pages = useQuery({ queryKey: ["pages"], queryFn: () => api.get("/pages") });
  const [slug, setSlug] = useState("home");
  const [error, setError] = useState(null);
  const current = (pages.data || []).find((page) => page.slug === slug);
  async function save(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.published = payload.published === "on";
    const parsed = pageSchema.safeParse(payload);
    if (!parsed.success) return setError({ message: "The page title is required." });
    try {
      await api.put(`/pages/${slug}`, parsed.data);
      pages.refetch();
      setError(null);
    } catch (err) {
      setError(err);
    }
  }
  return (
    <section>
      <PageTitle title="Website" />
      <h1 className="font-serif text-4xl text-pitch">Website copy</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {(pages.data || []).map((page) => (
          <Button key={page.slug} variant={page.slug === slug ? "primary" : "ghost"} onClick={() => setSlug(page.slug)}>{page.slug}</Button>
        ))}
      </div>
      {current ? (
        <form key={current.slug} className="mt-6 grid gap-3" onSubmit={save}>
          <Field label="Title"><input className={inputClass} name="title" defaultValue={current.title} /></Field>
          <Field label="Hero title"><input className={inputClass} name="heroTitle" defaultValue={current.heroTitle} /></Field>
          <Field label="Hero subtitle"><input className={inputClass} name="heroSubtitle" defaultValue={current.heroSubtitle} /></Field>
          <Field label="Body HTML"><textarea className={inputClass} name="bodyHtml" rows={8} defaultValue={current.bodyHtml} /></Field>
          <label className="text-sm"><input name="published" type="checkbox" defaultChecked={current.published} /> Published</label>
          <ErrorNote error={error} />
          <Button type="submit">Save page</Button>
        </form>
      ) : pages.isLoading ? <Spinner /> : null}
    </section>
  );
}

export function BannersAdminPage() {
  const queryClient = useQueryClient();
  const banners = useQuery({
    queryKey: ["banners-manage"],
    queryFn: () => api.get("/banners/manage"),
    staleTime: 15_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const [editing, setEditing] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const saveBanner = useMutation({
    mutationFn: ({ id, payload }) => id ? api.patch(`/banners/${id}`, payload) : api.post("/banners", payload),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["banners-manage"] }),
        queryClient.invalidateQueries({ queryKey: ["banners"] }),
      ]);
      setSuccessMessage(variables.id ? "Banner changes saved." : "Banner published on the homepage.");
      setEditing(null);
      setFile(null);
      setFormError(null);
    },
  });

  const deleteBanner = useMutation({
    mutationFn: (id) => api.del(`/banners/${id}`),
    onSuccess: async (_result, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["banners-manage"] }),
        queryClient.invalidateQueries({ queryKey: ["banners"] }),
      ]);
      if (editing?.id === id) {
        setEditing(null);
        setFile(null);
      }
      setSuccessMessage("Banner deleted.");
      setFormError(null);
    },
  });

  async function save(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form).entries());
    setFormError(null);
    setSuccessMessage("");
    saveBanner.reset();
    deleteBanner.reset();
    if (!editing && !file) {
      setFormError({ message: "Choose a player photo before publishing the banner." });
      return;
    }
    if (!fields.caption?.trim()) {
      setFormError({ message: "Add a caption for this player photo." });
      return;
    }
    if (!fields.playerName?.trim()) {
      setFormError({ message: "Enter the player's name." });
      return;
    }

    setUploading(Boolean(file));
    setUploadProgress(file ? 0 : null);
    try {
      let imageUrl = editing?.imageUrl || "";
      let publicId = editing?.publicId || "";
      if (file) {
        const uploaded = await api.upload("banners", file, setUploadProgress);
        imageUrl = uploaded.url;
        publicId = uploaded.publicId;
      }
      const parsed = bannerSchema.safeParse({
        ...fields,
        imageUrl,
        publicId,
        sortOrder: Number(fields.sortOrder || 0),
        published: fields.published === "on",
      });
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const messages = {
          imageUrl: "Choose a valid player photo to upload.",
          caption: "Caption must be 2 to 200 characters.",
          playerName: "Player name must be 2 to 80 characters.",
          tag: "Tag must be 48 characters or fewer.",
          country: "Country must be 80 characters or fewer.",
          teamName: "Team name must be 100 characters or fewer.",
          sortOrder: "Display order must be a whole number from 0 to 9999.",
        };
        setFormError({ message: messages[issue?.path?.[0]] || "Check the banner details and try again." });
        return;
      }
      await saveBanner.mutateAsync({ id: editing?.id, payload: parsed.data });
      form.reset();
    } catch (err) {
      setFormError({ message: bannerErrorMessage(err, editing ? "save banner changes" : "publish this banner") });
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  function edit(item) {
    setEditing(item);
    setFile(null);
    setFormError(null);
    setSuccessMessage("");
    saveBanner.reset();
    deleteBanner.reset();
  }

  function remove(item) {
    if (!window.confirm(`Delete the banner for ${item.playerName}?`)) return;
    setSuccessMessage("");
    setFormError(null);
    saveBanner.reset();
    deleteBanner.mutate(item.id);
  }

  const saving = uploading || saveBanner.isPending;

  return (
    <section>
      <PageTitle title="Home banners" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fairway">Website sections</p>
          <h1 className="mt-1 font-serif text-4xl text-pitch">Home banners</h1>
        </div>
        <p className="text-sm text-ink/60">Manage the player spotlights shown to everyone on the homepage.</p>
      </div>

      {successMessage ? <p className="mt-4 rounded-xl border border-fairway/20 bg-fairway/5 px-4 py-3 text-sm text-fairway" role="status">{successMessage}</p> : null}
      {banners.isError ? (
        <div className="mt-4 flex flex-wrap items-center gap-2" role="alert">
          <ErrorNote error={{ message: bannerErrorMessage(banners.error, banners.data ? "refresh homepage banners" : "load homepage banners") }} />
          <Button variant="ghost" onClick={() => banners.refetch()}>Retry</Button>
        </div>
      ) : null}
      {deleteBanner.isError ? <div className="mt-4"><ErrorNote error={{ message: bannerErrorMessage(deleteBanner.error, "delete this banner") }} /></div> : null}

      {!editing && (banners.data?.length || 0) >= 5 ? (
        <div className="mt-6 rounded-3xl border border-gold/30 bg-gold/10 p-5 text-sm text-pitch">
          Five banners is the homepage limit. Delete one of the current banners to add another.
        </div>
      ) : (
      <form key={editing?.id || "new-banner"} className="mt-6 grid gap-4 rounded-3xl border border-line bg-paper p-5 shadow-sm sm:p-7 lg:grid-cols-2" onSubmit={save}>
        <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-2xl text-pitch">{editing ? "Edit banner" : "Add a player banner"}</h2>
          {editing ? <Button variant="ghost" onClick={() => { setEditing(null); setFile(null); setFormError(null); }}>Cancel edit</Button> : null}
        </div>
        <div className="lg:col-span-2">
          <ImagePicker label={saving ? "Uploading photo…" : editing ? "Replace player photo" : "Choose player photo"} name="file" file={file} onFileChange={setFile} currentUrl={editing?.imageUrl || ""} disabled={saving} uploadProgress={uploadProgress} />
        </div>
        <Field label="Caption"><input className={inputClass} name="caption" maxLength={200} required defaultValue={editing?.caption || ""} placeholder="A short story about this moment" /></Field>
        <Field label="Player name"><input className={inputClass} name="playerName" maxLength={80} required defaultValue={editing?.playerName || ""} placeholder="Player name" /></Field>
        <Field label="Tag"><input className={inputClass} name="tag" maxLength={48} defaultValue={editing?.tag || ""} placeholder="e.g. Player spotlight" /></Field>
        <Field label="Country"><input className={inputClass} name="country" maxLength={80} defaultValue={editing?.country || ""} placeholder="Country" /></Field>
        <Field label="Team name"><input className={inputClass} name="teamName" maxLength={100} defaultValue={editing?.teamName || ""} placeholder="Club or team" /></Field>
        <Field label="Display order"><input className={inputClass} name="sortOrder" type="number" min="0" max="9999" defaultValue={editing?.sortOrder ?? 0} /></Field>
        <label className="flex items-center gap-2 text-sm text-ink"><input name="published" type="checkbox" defaultChecked={editing?.published ?? true} /> Visible on the public homepage</label>
        <div className="flex items-center gap-3 lg:col-span-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving banner…" : editing ? "Save changes" : "Publish banner"}</Button>
          {formError ? <ErrorNote error={formError} /> : null}
        </div>
      </form>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl text-pitch">All banners</h2>
        <span className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-ink/65">{banners.data?.length || 0} total</span>
      </div>
      {banners.isLoading ? <div className="mt-5"><Spinner /></div> : null}
      {!banners.isLoading && !banners.isError && !banners.data?.length ? <div className="mt-5"><Empty title="No player banners yet" body="Add a player photo above to feature it on the homepage." /></div> : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(banners.data || []).map((item) => (
          <article key={item.id} className="group overflow-hidden rounded-3xl border border-line bg-paper shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="relative aspect-[4/3] overflow-hidden bg-pitch/5">
              <img src={imageUrl(item.imageUrl, 720)} alt={`${item.playerName} — ${item.caption}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${item.published ? "bg-fairway/90 text-white" : "bg-pitch/80 text-cream"}`}>{item.published ? "Live" : "Draft"}</span>
              {item.tag ? <span className="absolute bottom-3 left-3 rounded-full border border-white/30 bg-pitch/75 px-3 py-1 text-xs font-medium text-white backdrop-blur">{item.tag}</span> : null}
            </div>
            <div className="p-4">
              <h3 className="font-serif text-xl text-pitch">{item.playerName}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-ink/70">{item.caption}</p>
              <p className="mt-2 text-xs text-ink/55">{[item.teamName, item.country].filter(Boolean).join(" · ") || "No team or country set"}</p>
              <div className="mt-4 flex gap-2 border-t border-line pt-3">
                <Button variant="ghost" className="flex-1 border border-line" onClick={() => edit(item)}>Edit</Button>
                <Button variant="danger" className="flex-1" disabled={deleteBanner.isPending} onClick={() => remove(item)}>{deleteBanner.isPending ? "Deleting…" : "Delete"}</Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function GalleryAdminPage() {
  const gallery = useQuery({ queryKey: ["gallery-manage"], queryFn: () => api.get("/gallery/manage") });
  const refresh = useInvalidate(["gallery-manage", "gallery"]);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState("");
  async function add(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const caption = form.caption.value;
    setUploading(true);
    setUploadProgress(file ? 0 : null);
    try {
      let imageUrlValue = form.imageUrl.value;
      let publicId = "";
      if (file) {
        const uploaded = await api.upload("gallery", file, setUploadProgress);
        imageUrlValue = uploaded.url;
        publicId = uploaded.publicId;
      }
      const parsed = gallerySchema.safeParse({ imageUrl: imageUrlValue, publicId, caption, published: true });
      if (!parsed.success) return setError({ message: "Add an https image URL or upload a file. Cloudinary must be configured for uploads." });
      await api.post("/gallery", parsed.data);
      form.reset();
      setFile(null);
      refresh();
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }
  async function removeGalleryItem(item) {
    if (!window.confirm(`Permanently remove “${item.caption || "this gallery image"}”${item.publicId ? " from Cloudinary too" : ""}?`)) return;
    setRemovingId(item.id);
    setError(null);
    try {
      await api.del(`/gallery/${item.id}`);
      refresh();
    } catch (err) {
      setError(err);
    } finally {
      setRemovingId("");
    }
  }
  return (
    <section>
      <PageTitle title="Gallery" />
      <h1 className="font-serif text-4xl text-pitch">Gallery</h1>
      <form className="mt-6 grid gap-3 rounded-3xl border border-line bg-paper p-5" onSubmit={add}>
        <Field label="Image URL"><input className={inputClass} name="imageUrl" placeholder="https://" /></Field>
        <ImagePicker label={uploading ? "Uploading..." : "Choose gallery photo"} name="file" file={file} onFileChange={setFile} disabled={uploading} uploadProgress={uploadProgress} />
        <Field label="Caption"><input className={inputClass} name="caption" /></Field>
        <ErrorNote error={error} />
        <Button type="submit" disabled={uploading}>{uploading ? "Uploading picture..." : "Add picture"}</Button>
      </form>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(gallery.data || []).map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-3xl border border-line bg-paper">
            <img src={imageUrl(item.imageUrl, 640)} alt={item.caption || ""} className="h-44 w-full object-cover" loading="lazy" />
            <figcaption className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{item.caption || "Untitled"}</span>
              <Button variant="ghost" disabled={removingId === item.id} onClick={() => removeGalleryItem(item)}>{removingId === item.id ? "Deleting…" : "Remove"}</Button>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function ProgramsAdminPage() {
  const programs = useQuery({ queryKey: ["programs-all"], queryFn: () => api.get("/programs/all") });
  const refresh = useInvalidate(["programs-all", "programs"]);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.sortOrder = Number(payload.sortOrder || 0);
    payload.isPublished = payload.isPublished === "on";
    const parsed = programSchema.safeParse(payload);
    if (!parsed.success) return setError({ message: "Complete the program name, description, age group and schedule." });
    setError(null);
    setUploading(true);
    setUploadProgress(file ? 0 : null);
    try {
      let imageUrlValue = parsed.data.imageUrl;
      let imagePublicId = parsed.data.imagePublicId;
      if (file) {
        const uploaded = await api.upload("programs", file, setUploadProgress);
        imageUrlValue = uploaded.url;
        imagePublicId = uploaded.publicId;
      }
      await api.post("/programs", { ...parsed.data, imageUrl: imageUrlValue, imagePublicId });
      form.reset();
      setFile(null);
      setUploadProgress(null);
      refresh();
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <section>
      <PageTitle title="Programs" />
      <h1 className="font-serif text-4xl text-pitch">Programs</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">Manage public training programs and their cover images. Uploaded images are converted to WebP and stored in the academy Cloudinary programs folder.</p>
      <form className="mt-6 grid gap-3 rounded-3xl border border-line bg-paper p-5 md:grid-cols-2" onSubmit={submit}>
        <div className="md:col-span-2"><ImagePicker label={uploading ? "Uploading program image…" : "Choose program image"} file={file} onFileChange={setFile} disabled={uploading} uploadProgress={uploadProgress} /><p className="mt-2 text-xs text-ink/55">Optional cover photo. It will appear on the public Programs page.</p></div>
        <Field label="Name"><input className={inputClass} name="name" required /></Field>
        <Field label="Age group"><input className={inputClass} name="ageGroup" required /></Field>
        <Field label="Schedule"><input className={inputClass} name="scheduleSummary" required /></Field>
        <Field label="Sort order"><input className={inputClass} name="sortOrder" type="number" defaultValue="0" /></Field>
        <Field label="Description"><textarea className={`${inputClass} md:col-span-2`} name="description" rows={4} required /></Field>
        <label className="text-sm"><input name="isPublished" type="checkbox" defaultChecked /> Published</label>
        <ErrorNote error={error} />
        <div><Button type="submit" disabled={uploading}>{uploading ? "Saving program…" : "Add program"}</Button></div>
      </form>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(programs.data || []).map((program) => (
          <article key={program.id} className="overflow-hidden rounded-3xl border border-line bg-paper">
            {program.imageUrl ? <img src={imageUrl(program.imageUrl, 800)} alt={`${program.name} training program`} className="h-48 w-full bg-ink/5 object-cover sm:h-56" loading="lazy" decoding="async" /> : null}
            <div className="p-5">
            <h2 className="font-serif text-2xl text-pitch">{program.name}</h2>
            <p className="text-sm text-ink/70">{program.ageGroup} · {program.scheduleSummary}</p>
            <p className="mt-2 text-sm">{program.description}</p>
            <Badge tone={program.isPublished ? "gold" : "clay"}>{program.isPublished ? "Published" : "Hidden"}</Badge>
            <div className="mt-3"><Button variant="danger" onClick={async () => { const message = program.imagePublicId ? "Permanently remove this program and its Cloudinary image? This cannot be undone." : "Permanently remove this program? This cannot be undone."; if (window.confirm(message)) { try { await api.del(`/programs/${program.id}`); refresh(); setError(null); } catch (err) { setError(err); } } }}>Remove</Button></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
