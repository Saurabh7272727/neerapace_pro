import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge, Empty, PageTitle, Spinner } from "../../components/ui.jsx";
import { useSession } from "../../hooks/useSession.js";
import { api } from "../../lib/api.js";

export function AdminDashboard() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => api.get("/stats/admin") });
  const cards = [
    ["Approved players", stats.data?.students],
    ["Waiting on review", stats.data?.pending],
    ["Active batches", stats.data?.activeBatches],
    ["Present today", stats.data?.presentToday],
    ["New enquiries", stats.data?.newEnquiries],
  ];
  return (
    <section>
      <PageTitle title="Office" />
      <h1 className="font-serif text-4xl text-pitch">Academy office</h1>
      <p className="mt-2 text-sm text-ink/70">Admissions, batches and today's attendance in one place.</p>
      {stats.isLoading ? <Spinner /> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-3xl border border-line bg-paper p-5">
            <p className="text-sm text-ink/60">{label}</p>
            <p className="mt-2 font-serif text-4xl text-pitch">{value ?? "—"}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link className="rounded-full bg-pitch px-4 py-2 text-cream" to="/app/admissions">Review admissions</Link>
        <Link className="rounded-full border border-line px-4 py-2" to="/app/attendance">Mark attendance</Link>
      </div>
    </section>
  );
}

export function CoachDashboard() {
  const batches = useQuery({ queryKey: ["batches"], queryFn: () => api.get("/batches") });
  const students = useQuery({ queryKey: ["students"], queryFn: () => api.get("/students") });
  return (
    <section>
      <PageTitle title="Coach" />
      <h1 className="font-serif text-4xl text-pitch">Your squads</h1>
      {batches.isLoading ? <Spinner /> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(batches.data || []).map((batch) => (
          <article key={batch.id} className="rounded-3xl border border-line bg-paper p-5">
            <Badge>{batch.status}</Badge>
            <h2 className="mt-3 font-serif text-2xl text-pitch">{batch.name}</h2>
            <p className="text-sm text-ink/70">{batch.schedule}</p>
            <p className="mt-2 text-sm">{batch.studentCount} players · {batch.program?.name}</p>
          </article>
        ))}
      </div>
      {!batches.data?.length && !batches.isLoading ? <div className="mt-6"><Empty title="No batch yet" body="The office assigns you to a batch before players appear here." /></div> : null}
      <p className="mt-6 text-sm text-ink/70">{students.data?.length || 0} assigned players. Attendance is read-only for coaches.</p>
    </section>
  );
}

export function StudentDashboard() {
  const session = useSession();
  const profile = session.data?.profile;
  const attendance = useQuery({ queryKey: ["my-attendance"], queryFn: () => api.get("/attendance"), enabled: session.data?.status === "active" });
  return (
    <section>
      <PageTitle title="Player" />
      <h1 className="font-serif text-4xl text-pitch">{session.data?.name}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{profile?.admissionStatus || session.data?.status}</Badge>
        {profile?.registrationId ? <Badge tone="gold">{profile.registrationId}</Badge> : null}
      </div>
      {session.data?.status === "pending_approval" ? <p className="mt-4 max-w-xl text-sm">Your email is confirmed. The office still needs to approve the application before a batch is assigned.</p> : null}
      {session.data?.status === "rejected" ? <p className="mt-4 max-w-xl text-sm text-clay">{profile?.reviewNote || "The office did not approve this application."}</p> : null}
      <article className="mt-6 rounded-3xl border border-line bg-paper p-5">
        <h2 className="font-serif text-2xl text-pitch">Batch</h2>
        {profile?.batch ? <p className="mt-2">{profile.batch.name} · {profile.batch.schedule}</p> : <p className="mt-2 text-sm text-ink/70">No batch assigned yet.</p>}
        <p className="mt-2 text-sm">Program: {profile?.program?.name || "—"}</p>
      </article>
      <div className="mt-6">
        <h2 className="font-serif text-2xl text-pitch">Recent attendance</h2>
        {(attendance.data || []).slice(0, 8).map((row) => (
          <p key={row.id} className="mt-2 text-sm">{row.date} · {row.status}</p>
        ))}
        {!attendance.data?.length ? <p className="mt-2 text-sm text-ink/70">Nothing recorded yet.</p> : null}
      </div>
    </section>
  );
}
