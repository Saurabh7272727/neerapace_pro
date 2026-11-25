import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Button, Empty, ErrorNote, PageTitle, inputClass } from "../../components/ui.jsx";
import { api, imageUrl } from "../../lib/api.js";

export function ChatPage() {
  const queryClient = useQueryClient();
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: () => api.get("/chat/conversations") });
  const contacts = useQuery({ queryKey: ["contacts"], queryFn: () => api.get("/chat/contacts") });
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState("");
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState("");
  const socketRef = useRef(null);
  const active = useMemo(() => (conversations.data || []).find((item) => item.id === activeId), [conversations.data, activeId]);

  useEffect(() => {
    const socket = io({ path: "/socket.io", withCredentials: true });
    socketRef.current = socket;
    socket.on("message:new", (message) => {
      setMessages((current) => (current.some((item) => item.id === message.id) || message.conversationId !== activeId ? current : [...current, message]));
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
    socket.on("typing", (payload) => {
      if (payload.conversationId === activeId) {
        setTyping(`${payload.name} is typing`);
        setTimeout(() => setTyping(""), 1500);
      }
    });
    socket.on("presence", () => queryClient.invalidateQueries({ queryKey: ["conversations"] }));
    socket.on("notification:new", () => queryClient.invalidateQueries({ queryKey: ["unread"] }));
    return () => socket.disconnect();
  }, [activeId, queryClient]);

  useEffect(() => {
    if (!activeId) return;
    let ignore = false;
    api.get(`/chat/conversations/${activeId}/messages`).then((rows) => {
      if (!ignore) setMessages(rows);
    }).catch(setError);
    socketRef.current?.emit("conversation:join", activeId);
    socketRef.current?.emit("conversation:read", { conversationId: activeId });
    api.post(`/chat/conversations/${activeId}/read`).catch(() => { });
    return () => {
      ignore = true;
    };
  }, [activeId]);

  async function start(participantId) {
    try {
      const conversation = await api.post("/chat/conversations", { participantId });
      setActiveId(conversation.id);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      setError(err);
    }
  }

  async function send(event) {
    event.preventDefault();
    if (!draft.trim() || !activeId) return;
    try {
      const message = await api.post(`/chat/conversations/${activeId}/messages`, { body: draft });
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      setError(err);
    }
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file || !activeId) return;
    try {
      const uploaded = await api.upload("chat", file);
      const message = await api.post(`/chat/conversations/${activeId}/messages`, { imageUrl: uploaded.url, imagePublicId: uploaded.publicId });
      setMessages((current) => [...current, message]);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <PageTitle title="Messages" />
      <aside className="rounded-3xl border border-line bg-paper p-4">
        <h1 className="font-serif text-2xl text-pitch">Messages</h1>
        <label className="mt-3 block text-xs text-ink/60">New conversation
          <select className={`${inputClass} mt-1`} defaultValue="" onChange={(event) => start(event.target.value)}>
            <option value="">Choose someone you can message</option>
            {(contacts.data || []).map((person) => <option key={person.id} value={person.id}>{person.name} · {person.role}</option>)}
          </select>
        </label>
        <div className="mt-4 space-y-2">
          {(conversations.data || []).map((conversation) => (
            <button key={conversation.id} type="button" className={`w-full rounded-2xl px-3 py-2 text-left text-sm ${conversation.id === activeId ? "bg-pitch text-cream" : "bg-cream"}`} onClick={() => setActiveId(conversation.id)}>
              <span className="block font-medium">{conversation.title}</span>
              <span className="block truncate opacity-70">{conversation.lastMessagePreview || "No messages yet"}</span>
              {conversation.unreadCount ? <span>{conversation.unreadCount} new</span> : null}
            </button>
          ))}
        </div>
      </aside>
      <div className="flex min-h-112 flex-col rounded-3xl border border-line bg-paper p-4">
        {!active ? <Empty title="Choose a conversation" body="Direct messages follow academy roles. Batch groups appear when you are assigned." /> : (
          <>
            <header>
              <h2 className="font-serif text-2xl text-pitch">{active.title}</h2>
              <p className="text-xs text-ink/60">{active.participants.filter((person) => person.online).map((person) => person.name).join(", ") || "Offline"} {typing}</p>
            </header>
            <div className="mt-4 flex-1 space-y-3 overflow-auto">
              {messages.map((message) => (
                <article key={message.id} className="max-w-lg rounded-2xl bg-cream px-3 py-2 text-sm">
                  <p className="text-xs text-ink/50">{message.senderName} · {new Date(message.createdAt).toLocaleString()}</p>
                  {message.body ? <p className="mt-1 whitespace-pre-wrap">{message.body}</p> : null}
                  {message.imageUrl ? <img src={imageUrl(message.imageUrl, 480)} alt="" className="mt-2 max-h-48 rounded-xl" loading="lazy" /> : null}
                </article>
              ))}
            </div>
            <ErrorNote error={error} />
            <form className="mt-3 flex gap-2" onSubmit={send}>
              <input className={inputClass} value={draft} onChange={(event) => { setDraft(event.target.value); socketRef.current?.emit("typing", { conversationId: activeId }); }} placeholder="Write a message" />
              <label className="grid cursor-pointer place-items-center rounded-full border border-line px-3 text-xs">
                Image
                <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} />
              </label>
              <Button type="submit">Send</Button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
