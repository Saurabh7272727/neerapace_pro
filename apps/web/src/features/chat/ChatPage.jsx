import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Button, Empty, ErrorNote, PageTitle, inputClass } from "../../components/ui.jsx";
import { useSession } from "../../hooks/useSession.js";
import { api, imageUrl } from "../../lib/api.js";

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function messageTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ChatPage() {
  const queryClient = useQueryClient();
  const session = useSession();
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: () => api.get("/chat/conversations") });
  const contacts = useQuery({ queryKey: ["contacts"], queryFn: () => api.get("/chat/contacts") });
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState("");
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const active = useMemo(() => (conversations.data || []).find((item) => item.id === activeId), [conversations.data, activeId]);
  const activeParticipant = active?.participants.find((person) => person.id !== session.data?.id);
  const filteredContacts = useMemo(() => (contacts.data || []).filter((person) => person.name.toLowerCase().includes(contactSearch.toLowerCase())), [contacts.data, contactSearch]);

  useEffect(() => {
    const socket = io({ path: "/socket.io", withCredentials: true });
    socketRef.current = socket;
    socket.on("message:new", (message) => {
      setMessages((current) => current.some((item) => item.id === message.id) || message.conversationId !== activeId ? current : [...current, message]);
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
    if (!activeId) {
      setMessages([]);
      return;
    }
    let ignore = false;
    setMessages([]);
    setError(null);
    api.get(`/chat/conversations/${activeId}/messages`).then((rows) => {
      if (!ignore) setMessages(rows);
    }).catch((err) => {
      if (!ignore) setError(err);
    });
    socketRef.current?.emit("conversation:join", activeId);
    socketRef.current?.emit("conversation:read", { conversationId: activeId });
    api.post(`/chat/conversations/${activeId}/read`).catch(() => { });
    return () => {
      ignore = true;
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeId]);

  async function start(participantId) {
    try {
      const conversation = await api.post("/chat/conversations", { participantId });
      setActiveId(conversation.id);
      setContactSearch("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      setError(err);
    }
  }

  async function send(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activeId) return;
    const conversationId = activeId;
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      id: localId,
      conversationId,
      senderId: session.data?.id || "",
      senderName: session.data?.name || "You",
      body,
      imageUrl: "",
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setDraft("");
    setError(null);
    setMessages((current) => [...current, optimistic]);
    try {
      const message = await api.post(`/chat/conversations/${conversationId}/messages`, { body });
      if (activeId !== conversationId) {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        return;
      }
      setMessages((current) => {
        const withoutLocal = current.filter((item) => item.id !== localId);
        return withoutLocal.some((item) => item.id === message.id) ? withoutLocal : [...withoutLocal, message];
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      setMessages((current) => current.filter((item) => item.id !== localId));
      if (activeId === conversationId) {
        setDraft((current) => current || body);
        setError(err);
      }
    }
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file || !activeId) return;
    const conversationId = activeId;
    try {
      const uploaded = await api.upload("chat", file);
      const message = await api.post(`/chat/conversations/${conversationId}/messages`, { imageUrl: uploaded.url, imagePublicId: uploaded.publicId });
      if (activeId !== conversationId) {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        return;
      }
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      if (activeId === conversationId) setError(err);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <PageTitle title="Messages" description="Keep up with your academy conversations." />
      <header className="flex items-center justify-between gap-4 lg:col-span-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fairway">Academy communication</p>
          <h1 className="mt-1 font-serif text-3xl text-pitch sm:text-4xl">Messages</h1>
        </div>
        <span className="hidden rounded-full border border-line bg-paper px-4 py-2 text-xs text-ink/60 sm:inline-flex">Private conversations</span>
      </header>

      <aside className="flex min-h-[72vh] flex-col overflow-hidden rounded-3xl border border-line bg-paper">
        <div className="border-b border-line p-4">
          <h2 className="font-semibold text-pitch">Your conversations</h2>
          <input
            className={`${inputClass} mt-3`}
            value={contactSearch}
            onChange={(event) => setContactSearch(event.target.value)}
            placeholder="Find a teammate or coach"
            aria-label="Find a contact"
          />
          <label className="mt-3 block text-xs font-medium text-ink/60">Start a conversation
            <select className={`${inputClass} mt-1`} value="" onChange={(event) => event.target.value && start(event.target.value)}>
              <option value="">Choose someone to message</option>
              {filteredContacts.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.role}</option>)}
            </select>
          </label>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {(conversations.data || []).map((conversation) => {
            const person = conversation.participants.find((item) => item.id !== session.data?.id);
            return (
              <button
                key={conversation.id}
                type="button"
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${conversation.id === activeId ? "bg-pitch text-cream" : "hover:bg-cream"}`}
                onClick={() => setActiveId(conversation.id)}
              >
                <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full font-semibold ${conversation.id === activeId ? "bg-white/15 text-gold" : "bg-pitch/10 text-pitch"}`}>
                  {initials(person?.name || conversation.title)}
                  {person?.online ? <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-paper bg-emerald-500" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{conversation.title}</span>
                    {conversation.lastMessageAt ? <time className="shrink-0 text-[11px] opacity-60">{messageTime(conversation.lastMessageAt)}</time> : null}
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-xs opacity-65">{conversation.lastMessagePreview || "Start the conversation"}</span>
                    {conversation.unreadCount ? <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-pitch">{conversation.unreadCount}</span> : null}
                  </span>
                </span>
              </button>
            );
          })}
          {!conversations.data?.length && !conversations.isLoading ? <p className="px-3 py-6 text-center text-sm text-ink/55">Your conversations will appear here.</p> : null}
        </div>
      </aside>

      <div className="flex min-h-[72vh] min-w-0 flex-col overflow-hidden rounded-3xl border border-line bg-paper">
        {!active ? <div className="grid flex-1 place-items-center p-6"><Empty title="Choose a conversation" body="Direct messages follow academy roles. Batch groups appear when you are assigned." /></div> : (
          <>
            <header className="flex items-center gap-3 border-b border-line bg-white/70 px-4 py-3 sm:px-6">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-pitch text-sm font-semibold text-gold">{initials(activeParticipant?.name || active.title)}</span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-pitch">{active.title}</h2>
                <p className="text-xs text-ink/55">{typing || (activeParticipant?.online ? "Online now" : "Conversation")} {activeParticipant?.role ? `· ${activeParticipant.role}` : ""}</p>
              </div>
              <span className="hidden text-xs text-ink/45 sm:block">Messages stay within your academy</span>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-cream/35 px-3 py-5 sm:px-6">
              {!messages.length ? <p className="py-12 text-center text-sm text-ink/50">No messages yet. Send a note to get things started.</p> : null}
              {messages.map((message) => {
                const own = message.senderId === session.data?.id;
                return (
                  <article key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[75%] ${own ? "rounded-br-md bg-pitch text-cream" : "rounded-bl-md border border-line/70 bg-white text-ink"}`}>
                      {!own ? <p className="mb-1 text-xs font-semibold text-fairway">{message.senderName}</p> : null}
                      {message.body ? <p className="whitespace-pre-wrap break-words leading-6">{message.body}</p> : null}
                      {message.imageUrl ? <img src={imageUrl(message.imageUrl, 480)} alt="Shared in conversation" className="mt-2 max-h-64 rounded-xl object-cover" loading="lazy" /> : null}
                      <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${own ? "text-cream/55" : "text-ink/45"}`}>
                        <time dateTime={message.createdAt}>{messageTime(message.createdAt)}</time>
                        {message.pending ? <span aria-label="Sending">· Sending</span> : null}
                      </p>
                    </div>
                  </article>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-line bg-white/75 p-3 sm:px-5 sm:py-4">
              <ErrorNote error={error} />
              <form className="mt-2 flex items-end gap-2" onSubmit={send}>
                <label className="grid h-11 shrink-0 cursor-pointer place-items-center rounded-full border border-line px-3 text-xs font-medium text-ink/70 transition hover:bg-cream" aria-label="Attach an image">
                  <span aria-hidden="true">＋</span>
                  <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} />
                </label>
                <textarea
                  className={`${inputClass} max-h-32 min-h-11 resize-y rounded-2xl py-3`}
                  value={draft}
                  onChange={(event) => { setDraft(event.target.value); socketRef.current?.emit("typing", { conversationId: activeId }); }}
                  placeholder="Write a message…"
                  aria-label="Write a message"
                  rows={1}
                />
                <Button type="submit" className="h-11 shrink-0 px-5">Send</Button>
              </form>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
