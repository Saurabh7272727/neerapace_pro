import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { toggleNav } from "../../app/uiSlice.js";
import { useSession } from "../../hooks/useSession.js";
import { linksFor } from "../../lib/access.js";
import { api } from "../../lib/api.js";
import { Button } from "../ui.jsx";

export function DashboardLayout() {
  const session = useSession();
  const collapsed = useSelector((state) => state.ui.navCollapsed);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const unread = useQuery({
    queryKey: ["unread"],
    queryFn: () => api.get("/notifications/unread"),
    enabled: Boolean(session.data),
  });
  const user = session.data;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event) => event.key === "Escape" && setMobileMenuOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  async function logout() {
    await api.post("/auth/logout");
    navigate("/login");
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-cream md:grid" style={{ gridTemplateColumns: collapsed ? "88px 1fr" : "240px 1fr" }}>
      <aside className="sticky top-0 hidden h-dvh min-h-0 self-start flex-col overflow-hidden border-r border-line bg-pitch text-cream md:flex">
        <div className="flex shrink-0 items-center justify-between px-4 py-4">
          <Link to="/" className="font-serif text-xl">{collapsed ? "NP" : "Neera Pace"}</Link>
          <button className="text-xs text-gold" type="button" onClick={() => dispatch(toggleNav())}>{collapsed ? "Open" : "Compact"}</button>
        </div>
        <nav aria-label="Dashboard navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-4 [scrollbar-color:rgb(255_255_255_/_0.3)_transparent] [scrollbar-width:thin]">
          {linksFor(user?.role).map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `block rounded-xl px-3 py-2 text-sm ${isActive ? "bg-cream text-pitch" : "text-cream/80"}`}>
              {collapsed ? link.label.slice(0, 1) : link.label}
              {link.to === "/app/notifications" && unread.data?.count ? ` (${unread.data.count})` : ""}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div onClick={() => setMobileMenuOpen(false)} className={`fixed inset-0 z-40 bg-pitch-dark/55 backdrop-blur-sm transition-opacity md:hidden ${mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!mobileMenuOpen} />
      <aside className={`fixed right-0 top-0 z-50 flex h-dvh min-h-0 w-[min(86vw,340px)] flex-col overflow-hidden bg-pitch p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-cream shadow-2xl transition-transform duration-300 md:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`} aria-label="Dashboard mobile navigation">
        <div className="flex shrink-0 items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 bg-gold/10 font-serif text-gold">NP</span><span className="font-serif text-xl">Neera Pace</span></Link>
          <button type="button" aria-label="Close dashboard menu" onClick={() => setMobileMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-cream/20 text-xl">×</button>
        </div>
        <nav aria-label="Dashboard mobile navigation links" className="mt-8 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pb-2 [scrollbar-color:rgb(255_255_255_/_0.3)_transparent] [scrollbar-width:thin]">
          {linksFor(user?.role).map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `block rounded-xl px-4 py-3 text-sm ${isActive ? "bg-gold text-pitch" : "text-cream/80 hover:bg-cream/10"}`}>
              {link.label}{link.to === "/app/notifications" && unread.data?.count ? ` (${unread.data.count})` : ""}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-cream/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-expanded={mobileMenuOpen} aria-label="Open dashboard menu" onClick={() => setMobileMenuOpen(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-paper md:hidden">
              <span className="grid gap-1.5"><span className="block h-0.5 w-5 rounded-full bg-pitch" /><span className="block h-0.5 w-5 rounded-full bg-pitch" /><span className="block h-0.5 w-5 rounded-full bg-pitch" /></span>
            </button>
            <p className="truncate text-sm text-ink/70">{user?.name} · {user?.role}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link to="/app/profile" className="rounded-full px-3 py-2 text-sm text-pitch">Profile</Link>
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={logout}>Sign out</Button>
          </div>
        </header>
        <main className="min-w-0 px-4 py-5 sm:px-6 md:px-8 md:py-6"><Outlet /></main>
      </div>
    </div>
  );
}
