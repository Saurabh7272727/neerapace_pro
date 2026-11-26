import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tableFeatures, useTable } from "@tanstack/react-table";
import { useState } from "react";
import { announcementSchema, batchSchema, coachCreateSchema, coachUpdateSchema, gallerySchema, pageSchema, programSchema, registerSchema, studentUpdateSchema } from "@neerapace/shared";
import { Badge, Button, Empty, ErrorNote, Field, Modal, PageTitle, Spinner, inputClass } from "../../components/ui.jsx";
import { ImagePicker } from "../../components/ImagePicker.jsx";
import { useSession } from "../../hooks/useSession.js";
import { api, fieldErrors, imageUrl } from "../../lib/api.js";

function useInvalidate(keys) {
  const queryClient = useQueryClient();
  return () => keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

export function StudentsPage() {
  const session = useSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const students = useQuery({ queryKey: ["students", page, search, session.data?.role], queryFn: () => api.getPage(`/students?${new URLSearchParams({ ...(session.data?.role === "admin" ? { status: "approved" } : {}), page: String(page), limit: "30", ...(search ? { q: search } : {}) })}`) });
  const programs = useQuery({ queryKey: ["programs-all"], queryFn: () => api.get("/programs/all"), enabled: session.data?.role === "admin" });
  const refresh = useInvalidate(["students", "stats"]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const admin = session.data?.role === "admin";
  const rows = students.data?.data || [];
  const table = useTable({ features: tableFeatures({}), data: rows, columns: [
    { accessorKey: "name", header: "Player" },
    { accessorKey: "registrationId", header: "Registration" },
    { accessorFn: (row) => row.program?.name || "—", id: "program", header: "Program" },
    { accessorFn: (row) => row.batch?.name || "—", id: "batch", header: "Batch" },
  ] });

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
    if (!window.confirm("Remove this player account?")) return;
    try {
      await api.del(`/students/${userId}`);
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
      {admin ? <input className={`${inputClass} mt-4 max-w-md`} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search players" aria-label="Search players" /> : null}
      {students.isLoading ? <Spinner /> : null}
      <div className="mt-6 overflow-auto rounded-3xl border border-line bg-paper">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="text-ink/60">{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th className="px-4 py-3" key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</th>)}{admin ? <th className="px-4 py-3">Action</th> : null}</tr>)}</thead>
          <tbody>{table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t border-line">
              {row.getAllCells().map((cell) => <td className="px-4 py-3" key={cell.id}>{cell.column.id === "name" ? <>{row.original.name}<div className="text-ink/60">{row.original.email}</div></> : <table.FlexRender cell={cell} />}</td>)}
              {admin ? <td className="px-4 py-3"><Button variant="danger" onClick={() => removeStudent(row.original.userId)}>Remove</Button></td> : null}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {!rows.length && !students.isLoading ? <div className="mt-6"><Empty title="No players" body="Approved players appear after admission or an office entry." /></div> : null}
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

export function GalleryAdminPage() {
  const gallery = useQuery({ queryKey: ["gallery-manage"], queryFn: () => api.get("/gallery/manage") });
  const refresh = useInvalidate(["gallery-manage", "gallery"]);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  async function add(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const caption = form.caption.value;
    try {
      let imageUrlValue = form.imageUrl.value;
      let publicId = "";
      if (file) {
        const uploaded = await api.upload("gallery", file);
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
    }
  }
  return (
    <section>
      <PageTitle title="Gallery" />
      <h1 className="font-serif text-4xl text-pitch">Gallery</h1>
      <form className="mt-6 grid gap-3 rounded-3xl border border-line bg-paper p-5" onSubmit={add}>
        <Field label="Image URL"><input className={inputClass} name="imageUrl" placeholder="https://" /></Field>
        <ImagePicker label="Choose gallery photo" name="file" file={file} onFileChange={setFile} />
        <Field label="Caption"><input className={inputClass} name="caption" /></Field>
        <ErrorNote error={error} />
        <Button type="submit">Add picture</Button>
      </form>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(gallery.data || []).map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-3xl border border-line bg-paper">
            <img src={imageUrl(item.imageUrl, 640)} alt={item.caption || ""} className="h-44 w-full object-cover" loading="lazy" />
            <figcaption className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{item.caption || "Untitled"}</span>
              <Button variant="ghost" onClick={() => api.del(`/gallery/${item.id}`).then(refresh)}>Remove</Button>
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

  async function submit(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.sortOrder = Number(payload.sortOrder || 0);
    payload.isPublished = payload.isPublished === "on";
    const parsed = programSchema.safeParse(payload);
    if (!parsed.success) return setError({ message: "Complete the program name, description, age group and schedule." });
    try {
      await api.post("/programs", parsed.data);
      event.currentTarget.reset();
      refresh();
      setError(null);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <section>
      <PageTitle title="Programs" />
      <h1 className="font-serif text-4xl text-pitch">Programs</h1>
      <form className="mt-6 grid gap-3 rounded-3xl border border-line bg-paper p-5 md:grid-cols-2" onSubmit={submit}>
        <Field label="Name"><input className={inputClass} name="name" required /></Field>
        <Field label="Age group"><input className={inputClass} name="ageGroup" required /></Field>
        <Field label="Schedule"><input className={inputClass} name="scheduleSummary" required /></Field>
        <Field label="Sort order"><input className={inputClass} name="sortOrder" type="number" defaultValue="0" /></Field>
        <Field label="Description"><textarea className={`${inputClass} md:col-span-2`} name="description" rows={4} required /></Field>
        <label className="text-sm"><input name="isPublished" type="checkbox" defaultChecked /> Published</label>
        <ErrorNote error={error} />
        <div><Button type="submit">Add program</Button></div>
      </form>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(programs.data || []).map((program) => (
          <article key={program.id} className="rounded-3xl border border-line bg-paper p-5">
            <h2 className="font-serif text-2xl text-pitch">{program.name}</h2>
            <p className="text-sm text-ink/70">{program.ageGroup} · {program.scheduleSummary}</p>
            <p className="mt-2 text-sm">{program.description}</p>
            <Badge tone={program.isPublished ? "gold" : "clay"}>{program.isPublished ? "Published" : "Hidden"}</Badge>
            <div className="mt-3"><Button variant="danger" onClick={async () => { if (window.confirm("Remove this program?")) { try { await api.del(`/programs/${program.id}`); refresh(); } catch (err) { setError(err); } } }}>Remove</Button></div>
          </article>
        ))}
      </div>
    </section>
  );
}
