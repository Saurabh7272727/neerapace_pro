import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge, Button, Empty, ErrorNote, PageTitle, Spinner, inputClass } from "../../components/ui.jsx";
import { api } from "../../lib/api.js";
import { StudentContactActions } from "./StudentContactActions.jsx";

export function AdmissionsPage() {
  const queryClient = useQueryClient();
  const admissions = useQuery({ queryKey: ["admissions"], queryFn: () => api.get("/admissions") });
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const decision = useMutation({
    mutationFn: ({ userId, decision: choice, note }) => api.post(`/admissions/${userId}/decision`, { decision: choice, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setError(null);
    },
    onError: setError,
  });
  const applications = admissions.data || [];
  const needsReview = applications.filter((student) => student.status !== "pending_email" && !["approved", "rejected"].includes(student.admissionStatus)).length;
  const waitingForEmail = applications.filter((student) => student.status === "pending_email").length;
  const filteredApplications = applications.filter((student) => {
    const matchesSearch = `${student.name} ${student.email} ${student.registrationId}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all"
      || (filter === "review" && student.status !== "pending_email" && !["approved", "rejected"].includes(student.admissionStatus))
      || (filter === "email" && student.status === "pending_email")
      || (filter === "decided" && ["approved", "rejected"].includes(student.admissionStatus));
    return matchesSearch && matchesFilter;
  });

  return (
    <section>
      <PageTitle title="Admissions" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-pitch">Admissions</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/70">Review new player registrations. Applicants can be approved once they verify their email; approval opens their player dashboard.</p>
        </div>
        <Button variant="ghost" onClick={() => admissions.refetch()} disabled={admissions.isFetching}>
          {admissions.isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => setFilter("all")} className={`rounded-2xl border p-4 text-left ${filter === "all" ? "border-pitch bg-pitch text-cream" : "border-line bg-paper text-pitch"}`}>
          <span className="block text-2xl font-semibold">{applications.length}</span><span className="text-sm opacity-75">All applications</span>
        </button>
        <button type="button" onClick={() => setFilter("review")} className={`rounded-2xl border p-4 text-left ${filter === "review" ? "border-pitch bg-pitch text-cream" : "border-line bg-paper text-pitch"}`}>
          <span className="block text-2xl font-semibold">{needsReview}</span><span className="text-sm opacity-75">Ready for review</span>
        </button>
        <button type="button" onClick={() => setFilter("email")} className={`rounded-2xl border p-4 text-left ${filter === "email" ? "border-pitch bg-pitch text-cream" : "border-line bg-paper text-pitch"}`}>
          <span className="block text-2xl font-semibold">{waitingForEmail}</span><span className="text-sm opacity-75">Waiting for email</span>
        </button>
      </div>
      <div className="mt-5">
        <input className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or registration ID" aria-label="Search admissions" />
      </div>
      <ErrorNote error={error} />
      <ErrorNote error={admissions.error} />
      {admissions.isLoading ? <Spinner /> : null}
      <div className="mt-6 space-y-3">
        {filteredApplications.map((student) => (
          <article key={student.id} className="rounded-3xl border border-line bg-paper p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-2xl text-pitch">{student.name}</h2>
              <Badge>{student.admissionStatus}</Badge>
              <Badge tone="gold">{student.registrationId}</Badge>
            </div>
            <dl className="mt-4 grid gap-x-6 gap-y-3 rounded-2xl bg-white/70 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="font-semibold text-ink/60">Email</dt><dd className="break-all">{student.email || "Not provided"}</dd></div>
              <div><dt className="font-semibold text-ink/60">Phone</dt><dd>{student.phone || "Not provided"}</dd></div>
              <div><dt className="font-semibold text-ink/60">Date of birth</dt><dd>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "Not provided"}</dd></div>
              <div><dt className="font-semibold text-ink/60">Gender</dt><dd>{student.gender || "Not provided"}</dd></div>
              <div><dt className="font-semibold text-ink/60">Home address</dt><dd className="break-words">{student.address || "Not provided"}</dd></div>
              <div><dt className="font-semibold text-ink/60">Program</dt><dd>{student.program?.name || "—"}</dd></div>
              <div><dt className="font-semibold text-ink/60">Guardian</dt><dd>{student.guardianName || "Not provided"}</dd></div>
              <div><dt className="font-semibold text-ink/60">Guardian phone</dt><dd>{student.guardianPhone || "Not provided"}</dd></div>
              <div><dt className="font-semibold text-ink/60">Guardian email</dt><dd className="break-all">{student.guardianEmail || "Not provided"}</dd></div>
              <div><dt className="font-semibold text-ink/60">Account status</dt><dd>{student.status || "—"}</dd></div>
            </dl>
            <div className="mt-4"><StudentContactActions student={student} /></div>
            {student.reviewNote ? <p className="mt-2 text-sm">{student.reviewNote}</p> : null}
            {student.status === "pending_email" ? (
              <p className="mt-3 rounded-xl bg-gold/15 px-3 py-2 text-sm text-pitch">Waiting for the applicant to verify their email. Approval is available after verification.</p>
            ) : null}
            {student.status !== "pending_email" && !["approved", "rejected"].includes(student.admissionStatus) ? (
              <div className="mt-4 flex gap-2">
                <Button disabled={decision.isPending} onClick={() => decision.mutate({ userId: student.userId, decision: "approved", note: "" })}>
                  {decision.isPending && decision.variables?.userId === student.userId && decision.variables.decision === "approved" ? "Approving…" : "Approve"}
                </Button>
                <Button variant="danger" disabled={decision.isPending} onClick={() => decision.mutate({ userId: student.userId, decision: "rejected", note: "Please contact the office if you want to reapply." })}>
                  {decision.isPending && decision.variables?.userId === student.userId && decision.variables.decision === "rejected" ? "Rejecting…" : "Reject"}
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {!applications.length && !admissions.isLoading && !admissions.error ? <div className="mt-6"><Empty title="No applications" body="New registrations show up here after a player submits the public form." /></div> : null}
      {applications.length > 0 && !filteredApplications.length ? <div className="mt-6"><Empty title="No matching applications" body="Try another search or choose a different application filter." /></div> : null}
    </section>
  );
}
