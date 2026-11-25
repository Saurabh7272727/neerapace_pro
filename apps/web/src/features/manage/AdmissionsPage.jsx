import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge, Button, Empty, ErrorNote, PageTitle, Spinner } from "../../components/ui.jsx";
import { api } from "../../lib/api.js";

export function AdmissionsPage() {
  const queryClient = useQueryClient();
  const admissions = useQuery({ queryKey: ["admissions"], queryFn: () => api.get("/admissions") });
  const [error, setError] = useState(null);
  const decision = useMutation({
    mutationFn: ({ userId, decision: choice, note }) => api.post(`/admissions/${userId}/decision`, { decision: choice, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setError(null);
    },
    onError: setError,
  });

  return (
    <section>
      <PageTitle title="Admissions" />
      <h1 className="font-serif text-4xl text-pitch">Admissions</h1>
      <p className="mt-2 text-sm text-ink/70">Approve a verified application to open the player dashboard. Rejection is emailed by the background job.</p>
      <ErrorNote error={error} />
      {admissions.isLoading ? <Spinner /> : null}
      <div className="mt-6 space-y-3">
        {(admissions.data || []).map((student) => (
          <article key={student.id} className="rounded-3xl border border-line bg-paper p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-2xl text-pitch">{student.name}</h2>
              <Badge>{student.admissionStatus}</Badge>
              <Badge tone="gold">{student.registrationId}</Badge>
            </div>
            <p className="mt-2 text-sm">{student.email} · {student.phone}</p>
            <p className="text-sm text-ink/70">Guardian {student.guardianName} · {student.guardianPhone}</p>
            <p className="text-sm">Program: {student.program?.name || "—"} · Account: {student.status}</p>
            {student.reviewNote ? <p className="mt-2 text-sm">{student.reviewNote}</p> : null}
            {student.status !== "pending_email" && !["approved", "rejected"].includes(student.admissionStatus) ? (
              <div className="mt-4 flex gap-2">
                <Button onClick={() => decision.mutate({ userId: student.userId, decision: "approved", note: "" })}>Approve</Button>
                <Button variant="danger" onClick={() => decision.mutate({ userId: student.userId, decision: "rejected", note: "Please contact the office if you want to reapply." })}>Reject</Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {!admissions.data?.length && !admissions.isLoading ? <div className="mt-6"><Empty title="No applications" body="New registrations show up after a player submits the public form." /></div> : null}
    </section>
  );
}
