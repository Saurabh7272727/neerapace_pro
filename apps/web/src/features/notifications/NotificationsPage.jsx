import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button, Empty, PageTitle } from "../../components/ui.jsx";
import { api } from "../../lib/api.js";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => api.get("/notifications") });
  const markOne = useMutation({
    mutationFn: (id) => api.post(`/notifications/${id}/read`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], (current = []) => current.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)));
      return { previous };
    },
    onError: (_error, _id, context) => queryClient.setQueryData(["notifications"], context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["unread"] }),
  });

  return (
    <section>
      <PageTitle title="Notifications" />
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-4xl text-pitch">Notifications</h1>
        <Button variant="ghost" onClick={() => api.post("/notifications/read-all").then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }))}>Mark all read</Button>
      </div>
      <div className="mt-6 space-y-3">
        {(notifications.data || []).map((item) => (
          <article key={item.id} className={`rounded-3xl border border-line p-5 ${item.readAt ? "bg-paper" : "bg-white"}`}>
            <h2 className="font-serif text-2xl text-pitch">{item.title}</h2>
            <p className="mt-2 text-sm whitespace-pre-wrap">{item.body}</p>
            <div className="mt-3 flex gap-3 text-sm">
              {item.link ? <Link className="text-fairway" to={item.link}>Open</Link> : null}
              {!item.readAt ? <button type="button" className="text-pitch" onClick={() => markOne.mutate(item.id)}>Mark read</button> : null}
            </div>
          </article>
        ))}
      </div>
      {!notifications.data?.length ? <div className="mt-6"><Empty title="No notifications" body="Admission updates, announcements and unread messages land here." /></div> : null}
    </section>
  );
}
