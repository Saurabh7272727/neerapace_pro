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
    <div className="min-h-screen overflow-x-clip">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:px-3 focus:py-2">Skip to content</a>
      <header className="public-header glass sticky top-0 z-40 border-b border-line/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center rounded-xl md:bg-pitch md:px-2 md:py-1">
            <picture>
              <source media="(min-width: 768px)" srcSet="/desktopView.svg" />
              <img src="/mobileView.svg" alt="Neera Pace Cricket Academy" className="h-11 w-11 object-contain md:h-[42px] md:w-[205px] lg:h-[49px] lg:w-[235px]" />
            </picture>
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-white/70 bg-white/55 p-1 shadow-[0_6px_22px_rgba(18,55,42,.08)] backdrop-blur-md md:flex lg:gap-1.5">
            {links.map(([label, to]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `public-nav-link rounded-full px-3 py-2 text-[13px] font-semibold tracking-wide transition-colors lg:px-3.5 ${isActive ? "public-nav-link-active" : "text-ink/70 hover:bg-white/80 hover:text-pitch"}`}>{label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            {session.data ? (
              <Link to={homeForRole(session.data.role)} className="nav-cta nav-cta-dark rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="hidden rounded-full px-4 py-2 text-[13px] font-semibold text-pitch/80 transition-colors hover:bg-white/70 hover:text-pitch lg:inline">Sign in</Link>
                <Link to="/register" className="nav-cta nav-cta-gold rounded-full px-4 py-2.5 text-[13px] font-bold text-pitch shadow-lg">Join academy</Link>
              </>
            )}
          </div>
          <button type="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} onClick={() => setMenuOpen((open) => !open)} className="mobile-menu-toggle grid h-11 w-11 place-items-center gap-1 rounded-xl md:hidden">
            <span className={`block h-0.5 w-5 rounded-full bg-pitch transition ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 rounded-full bg-pitch transition ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 rounded-full bg-pitch transition ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </button>
        </div>
      </header>
      <div onClick={() => setMenuOpen(false)} className={`fixed inset-0 z-30 bg-pitch-dark/55 backdrop-blur-sm transition-opacity md:hidden ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!menuOpen} />
      <aside className={`mobile-nav-panel fixed right-0 top-0 z-40 h-dvh w-[min(86vw,360px)] p-5 shadow-2xl transition-transform duration-300 md:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"}`} aria-label="Mobile navigation">
        <div className="flex items-center justify-between">
          <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center"><img src="/mobileView.svg" alt="Neera Pace Cricket Academy" className="h-10 w-10 object-contain" /></Link>
          <button type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} className="mobile-menu-toggle grid h-10 w-10 place-items-center rounded-full text-xl text-pitch">×</button>
        </div>
        <nav className="mt-8 flex-1">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `mobile-nav-link block rounded-2xl px-4 py-3.5 text-sm font-semibold tracking-wide transition ${isActive ? "mobile-nav-link-active" : "text-ink/75 hover:border-pitch/10 hover:bg-white/70 hover:text-pitch"}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="flex flex-col gap-2">
          {session.data ? (
            <Link to={homeForRole(session.data.role)} onClick={() => setMenuOpen(false)} className="nav-cta nav-cta-dark rounded-full px-5 py-3 text-center text-sm font-semibold text-white shadow-lg">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block rounded-full px-4 py-3 text-sm font-semibold text-pitch transition-colors hover:bg-white/70">Sign in</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="nav-cta nav-cta-gold rounded-full px-4 py-3 text-center text-sm font-bold text-pitch shadow-lg">Join academy</Link>
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
        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-6 sm:pb-8 sm:pt-14 lg:px-8 lg:pt-16">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-b border-cream/15 pb-8 sm:gap-x-8 sm:gap-y-10 sm:pb-10 lg:grid-cols-[1.4fr_.8fr_.8fr_1.2fr]">
            <div className="col-span-2 min-w-0 lg:col-span-1">
              <Link to="/" className="inline-flex max-w-full items-center rounded-xl">
                <img
                  src="/desktopView.svg"
                  alt="Neera Pace Cricket Academy"
                  className="h-auto w-[210px] max-w-full object-contain sm:w-[240px] lg:w-[280px]"
                />
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-6 text-cream/65">A place to learn the craft, enjoy the game and grow with your squad.</p>
            </div>
            <nav aria-label="Explore" className="min-w-0 text-sm">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Explore</h2>
              <div className="grid gap-3 text-cream/70">
                <Link className="transition-colors hover:text-gold" to="/programs">Programs</Link>
                <Link className="transition-colors hover:text-gold" to="/coaches">Coaches</Link>
                <Link className="transition-colors hover:text-gold" to="/facilities">Facilities</Link>
                <Link className="transition-colors hover:text-gold" to="/gallery">Gallery</Link>
              </div>
            </nav>
            <nav aria-label="Academy" className="min-w-0 text-sm">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Academy</h2>
              <div className="grid gap-3 text-cream/70">
                <Link className="transition-colors hover:text-gold" to="/about">Our story</Link>
                <Link className="transition-colors hover:text-gold" to="/contact">Contact</Link>
                <Link className="transition-colors hover:text-gold" to="/login">Sign in</Link>
              </div>
            </nav>
            <div className="col-span-2 min-w-0 rounded-3xl border border-cream/15 bg-white/5 p-5 backdrop-blur-sm sm:p-6 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Ready for your next innings?</p>
              <p className="mt-2 text-sm leading-6 text-cream/70">Explore the training pathways and take the first step towards joining the academy.</p>
              <Link to="/register" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-pitch transition hover:-translate-y-0.5 hover:bg-[#d4b36e] sm:w-auto">
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
