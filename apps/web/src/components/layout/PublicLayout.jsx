import { Link, NavLink, Outlet } from "react-router-dom";
import { useSession } from "../../hooks/useSession.js";
import { homeForRole } from "../../lib/access.js";
import { useEffect, useState } from "react";

const links = [
  ["Programs", "/programs"],
  ["Coaches", "/coaches"],
  ["Facilities", "/facilities"],
  ["Gallery", "/gallery"],
  ["Contact", "/contact"],
];

export function PublicLayout() {
  const session = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:px-3 focus:py-2">Skip to content</a>
      <header className="glass sticky top-0 z-40 border-b border-line/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-pitch font-serif text-gold shadow-lg">NP</span>
            <span><span className="block font-serif text-xl leading-none text-pitch">Neera Pace</span><span className="mt-1 block text-[10px] uppercase tracking-[0.24em] text-ink/50">Cricket Academy</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            {links.map(([label, to]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `transition ${isActive ? "font-medium text-fairway" : "text-ink/70 hover:text-pitch"}`}>{label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            {session.data ? (
              <Link to={homeForRole(session.data.role)} className="rounded-full bg-pitch px-5 py-2.5 text-cream shadow-lg shadow-pitch/15">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="hidden px-3 py-2 text-pitch sm:inline">Sign in</Link>
                <Link to="/register" className="rounded-full bg-gold px-4 py-2.5 font-medium text-pitch shadow-lg shadow-gold/20">Join academy</Link>
              </>
            )}
          </div>
          <button type="button" aria-expanded={menuOpen} aria-label="Open navigation menu" onClick={() => setMenuOpen((open) => !open)} className="grid h-11 w-11 place-items-center gap-1 rounded-xl border border-line bg-paper md:hidden">
            <span className={`block h-0.5 w-5 rounded-full bg-pitch transition ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 rounded-full bg-pitch transition ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 rounded-full bg-pitch transition ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </button>
        </div>
      </header>
      <div onClick={() => setMenuOpen(false)} className={`fixed inset-0 z-30 bg-pitch-dark/55 backdrop-blur-sm transition-opacity md:hidden ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!menuOpen} />
      <aside className={`fixed right-0 top-0 z-40 h-dvh w-[min(86vw,340px)] bg-paper p-5 shadow-2xl transition-transform duration-300 md:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"}`} aria-label="Mobile navigation">
        <div className="flex items-center justify-between">
          <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-pitch font-serif text-gold">NP</span><span className="font-serif text-xl text-pitch">Neera Pace</span></Link>
          <button type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-line text-xl text-pitch">×</button>
        </div>
        <nav className="mt-8 flex-1">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `block py-2 text-sm transition ${isActive ? "font-medium text-fairway" : "text-ink/70 hover:text-pitch"}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="flex flex-col gap-2">
          {session.data ? (
            <Link to={homeForRole(session.data.role)} onClick={() => setMenuOpen(false)} className="rounded-full bg-pitch px-5 py-2.5 text-cream shadow-lg shadow-pitch/15">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-pitch">Sign in</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="rounded-full bg-gold px-4 py-2.5 font-medium text-pitch shadow-lg shadow-gold/20">Join academy</Link>
            </>
          )}
        </div>
      </aside>
      <main id="content">
        <Outlet />
      </main>
      <footer className="relative mt-16 overflow-hidden bg-pitch text-cream">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full border border-gold/15 bg-gold/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-16 h-64 w-64 rounded-full border border-gold/10" />
        <div className="relative mx-auto max-w-7xl px-5 pb-6 pt-12 sm:px-8 lg:pt-16">
          <div className="grid gap-10 border-b border-cream/15 pb-10 lg:grid-cols-[1.4fr_.8fr_.8fr_1.2fr]">
            <div>
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/30 bg-gold/10 font-serif text-lg text-gold">NP</span>
                <span><span className="block font-serif text-2xl leading-none">Neera Pace</span><span className="mt-1 block text-[10px] uppercase tracking-[0.24em] text-cream/55">Cricket Academy</span></span>
              </Link>
              <p className="mt-5 max-w-sm text-sm leading-6 text-cream/65">A place to learn the craft, enjoy the game and grow with your squad.</p>
            </div>
            <nav aria-label="Explore" className="text-sm">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Explore</h2>
              <div className="grid gap-3 text-cream/70">
                <Link className="transition hover:text-cream" to="/programs">Programs</Link>
                <Link className="transition hover:text-cream" to="/coaches">Coaches</Link>
                <Link className="transition hover:text-cream" to="/facilities">Facilities</Link>
                <Link className="transition hover:text-cream" to="/gallery">Gallery</Link>
              </div>
            </nav>
            <nav aria-label="Academy" className="text-sm">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Academy</h2>
              <div className="grid gap-3 text-cream/70">
                <Link className="transition hover:text-cream" to="/about">Our story</Link>
                <Link className="transition hover:text-cream" to="/contact">Contact</Link>
                <Link className="transition hover:text-cream" to="/login">Sign in</Link>
              </div>
            </nav>
            <div className="rounded-3xl border border-cream/15 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Ready for your next innings?</p>
              <p className="mt-2 text-sm leading-6 text-cream/70">Explore the training pathways and take the first step towards joining the academy.</p>
              <Link to="/register" className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-pitch transition hover:-translate-y-0.5 hover:bg-[#d4b36e]">
                Start an application <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-5 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Neera Pace Cricket Academy</p>
            <p>Train with purpose. Play with heart.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
