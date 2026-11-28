import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge, Button, Empty, ErrorNote, PageTitle, Spinner, inputClass } from "../../components/ui.jsx";
import { api } from "../../lib/api.js";
import { StudentContactActions } from "./StudentContactActions.jsx";
import { StudentDetailGrid, StudentDetailPortal } from "./StudentDetailPortal.jsx";

export function AdmissionsPage() {
  const queryClient = useQueryClient();
  const admissions = useQuery({ queryKey: ["admissions"], queryFn: () => api.get("/admissions") });
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAdmissionId, setSelectedAdmissionId] = useState("");
  const decision = useMutation({
    mutationFn: ({ userId, decision: choice, note }) => api.post(`/admissions/${userId}/decision`, { decision: choice, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setError(null);
      setSelectedAdmissionId("");
    },
    onError: setError,
  });
  const applications = admissions.data || [];
  const selectedAdmission = applications.find((student) => student.userId === selectedAdmissionId) || null;
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
            <button type="button" aria-haspopup="dialog" onClick={() => { setError(null); setSelectedAdmissionId(student.userId); }} className="block w-full rounded-2xl p-2 text-left transition hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pitch">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-2xl text-pitch">{student.name}</span>
                <Badge>{student.admissionStatus}</Badge>
                <Badge tone="gold">{student.registrationId}</Badge>
              </span>
              <span className="mt-2 block break-all text-sm text-ink/70">{student.email || "No email provided"}{student.program?.name ? ` · ${student.program.name}` : ""}</span>
              <span className="mt-2 block text-xs font-semibold text-fairway">View full application</span>
            </button>
            <dl className="hidden">
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
            <div className="hidden"><StudentContactActions student={student} />{student.reviewNote}</div>
            {student.status === "pending_email" ? (
              <p className="mt-3 rounded-xl bg-gold/15 px-3 py-2 text-sm text-pitch">Waiting for the applicant to verify their email. Approval is available after verification.</p>
            ) : null}
            {student.status !== "pending_email" && !["approved", "rejected"].includes(student.admissionStatus) ? (
              <div className="hidden">
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
      <StudentDetailPortal
        open={Boolean(selectedAdmission)}
        title={selectedAdmission?.name || "Application details"}
        eyebrow={selectedAdmission?.registrationId || "Admission record"}
        onClose={() => setSelectedAdmissionId("")}
        footer={selectedAdmission && selectedAdmission.status !== "pending_email" && !["approved", "rejected"].includes(selectedAdmission.admissionStatus) ? <>
          <Button variant="danger" disabled={decision.isPending} onClick={() => decision.mutate({ userId: selectedAdmission.userId, decision: "rejected", note: "Please contact the office if you want to reapply." })}>Reject</Button>
          <Button disabled={decision.isPending} onClick={() => decision.mutate({ userId: selectedAdmission.userId, decision: "approved", note: "" })}>Approve</Button>
        </> : null}
      >
        {selectedAdmission ? <>
          <ErrorNote error={error} />
          <StudentDetailGrid fields={[
            ["Email", selectedAdmission.email],
            ["Phone", selectedAdmission.phone],
            ["Date of birth", selectedAdmission.dateOfBirth ? new Date(selectedAdmission.dateOfBirth).toLocaleDateString() : "Not provided"],
            ["Gender", selectedAdmission.gender],
            ["Program", selectedAdmission.program?.name],
            ["Home address", selectedAdmission.address],
            ["Guardian", selectedAdmission.guardianName],
            ["Guardian phone", selectedAdmission.guardianPhone],
            ["Guardian email", selectedAdmission.guardianEmail],
            ["Account status", selectedAdmission.status],
            ["Admission status", selectedAdmission.admissionStatus],
            ["Review note", selectedAdmission.reviewNote],
          ]} />
          {selectedAdmission.status === "pending_email" ? <p className="mt-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm leading-6 text-pitch">This application is waiting for email verification. Approval becomes available once the applicant confirms their email.</p> : null}
          <div className="mt-5"><StudentContactActions student={selectedAdmission} /></div>
        </> : null}
      </StudentDetailPortal>
      {!applications.length && !admissions.isLoading && !admissions.error ? <div className="mt-6"><Empty title="No applications" body="New registrations show up here after a player submits the public form." /></div> : null}
      {applications.length > 0 && !filteredApplications.length ? <div className="mt-6"><Empty title="No matching applications" body="Try another search or choose a different application filter." /></div> : null}
    </section>
  );
}
