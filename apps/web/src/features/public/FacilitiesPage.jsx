import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ErrorNote, PageTitle, Spinner } from "../../components/ui.jsx";
import { api } from "../../lib/api.js";

function readFacilityContent(markup = "") {
  if (typeof DOMParser === "undefined") return { heading: "On the ground", items: [], notes: [] };
  const document = new DOMParser().parseFromString(markup, "text/html");
  return {
    heading: document.querySelector("h2, h3")?.textContent?.trim() || "On the ground",
    items: Array.from(document.querySelectorAll("li"), (item) => item.textContent.trim()).filter(Boolean),
    notes: Array.from(document.querySelectorAll("p"), (note) => note.textContent.trim()).filter(Boolean),
  };
}

function GroundIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#0b2119]/85 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#dbc486]">Neera Pace</p>
          <p className="mt-1 text-sm font-medium text-white">Ground map <span className="text-white/45">/ Training zones</span></p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-[#dbc486]" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6 6 18"/></svg>
        </span>
      </div>
      <svg className="mt-3 w-full" viewBox="0 0 600 390" role="img" aria-labelledby="ground-map-title ground-map-desc">
        <title id="ground-map-title">Illustrated cricket training ground</title>
        <desc id="ground-map-desc">A top-down field illustration showing a central wicket and parallel net lanes.</desc>
        <defs>
          <linearGradient id="field-fill" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#2e7651"/><stop offset="1" stopColor="#17432f"/></linearGradient>
          <pattern id="field-lines" width="18" height="18" patternTransform="rotate(35)" patternUnits="userSpaceOnUse"><path d="M0 0v18" stroke="#d8e6d8" strokeOpacity=".09" strokeWidth="7"/></pattern>
        </defs>
        <ellipse cx="300" cy="190" rx="267" ry="170" fill="#11291f" stroke="#cbb578" strokeOpacity=".7" strokeWidth="2"/>
        <ellipse cx="300" cy="190" rx="248" ry="151" fill="url(#field-fill)"/>
        <ellipse cx="300" cy="190" rx="248" ry="151" fill="url(#field-lines)"/>
        <ellipse cx="300" cy="190" rx="185" ry="111" fill="none" stroke="#eef4e7" strokeOpacity=".38" strokeDasharray="5 8"/>
        <rect x="282" y="103" width="36" height="174" rx="4" fill="#c9a77a"/>
        <path d="M277 124h46M277 256h46" stroke="#f3ead8" strokeWidth="2"/>
        <path d="M291 118v12m9-12v12m9-12v12m-18 120v12m9-12v12m9-12v12" stroke="#fff9e9" strokeWidth="2"/>
        <g fill="#0c241c" stroke="#e8dfc9" strokeOpacity=".82" strokeWidth="1.5">
          <rect x="82" y="72" width="62" height="40" rx="5"/><rect x="151" y="58" width="62" height="40" rx="5"/>
          <rect x="387" y="58" width="62" height="40" rx="5"/><rect x="456" y="72" width="62" height="40" rx="5"/>
        </g>
        <g stroke="#e8dfc9" strokeOpacity=".35" strokeWidth="1">
          <path d="M93 75v34m11-34v34m11-34v34m11-34v34m11-34v34M162 61v34m11-34v34m11-34v34m11-34v34m11-34v34"/>
          <path d="M398 61v34m11-34v34m11-34v34m11-34v34m11-34v34m11 0V75m11 34V75m11 34V75m11 34V75m11 34V75"/>
        </g>
        <g fill="#f0dfae" fontFamily="sans-serif" fontSize="10" fontWeight="700" letterSpacing="1.2" textAnchor="middle">
          <text x="113" y="59">NETS</text><text x="182" y="45">NETS</text><text x="418" y="45">NETS</text><text x="487" y="59">NETS</text>
          <text x="300" y="304">CENTER WICKET</text>
        </g>
        <path d="M300 312v20m-7-7 7 7 7-7" fill="none" stroke="#e3cc8b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="300" cy="190" r="4" fill="#f8e6a8"/>
      </svg>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-white/55">
        <span>Practice with purpose</span><span>Open field · Focused lanes</span>
      </div>
    </div>
  );
}

export function FacilitiesPage() {
  const page = useQuery({ queryKey: ["page", "facilities"], queryFn: () => api.get("/pages/facilities") });
  if (page.isLoading) return <Spinner />;
  if (page.error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorNote error={page.error} /></div>;

  const content = readFacilityContent(page.data.bodyHtml);
  return (
    <main className="overflow-hidden">
      <PageTitle title={page.data.title || "Facilities"} description={page.data.heroSubtitle} />
      <section className="relative isolate overflow-hidden bg-pitch-dark text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px)", backgroundSize: "38px 38px" }} />
        <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-52 -z-10 h-[34rem] w-[34rem] rounded-full border border-gold/20 bg-fairway/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[.92fr_1.08fr] lg:gap-14 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.19em] text-[#e8d6a4]">
              <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_12px_rgba(226,196,126,.8)]" />The training ground
            </span>
            <h1 className="mt-5 max-w-[16ch] font-serif text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">{page.data.heroTitle || "Built for the work behind every innings."}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">{page.data.heroSubtitle || "A focused place to train, improve and play the game."}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/contact" className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-pitch-dark shadow-lg shadow-gold/10 transition hover:-translate-y-0.5 hover:bg-[#dbc486]">Plan an academy visit <span className="ml-2" aria-hidden="true">↗</span></Link>
              <Link to="/programs" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-gold/50 hover:bg-white/10">Explore training programs</Link>
            </div>
          </div>
          <GroundIllustration />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="flex flex-col justify-between gap-3 border-b border-line pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fairway">A place for every part of the game</p>
            <h2 className="mt-2 font-serif text-3xl text-pitch sm:text-4xl">{content.heading}</h2>
          </div>
          <span className="text-sm text-ink/55">Train · Repeat · Play</span>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((item, index) => (
            <article key={`${item}-${index}`} className="group relative min-h-44 overflow-hidden rounded-3xl border border-line bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-fairway/35 hover:shadow-xl hover:shadow-pitch/5 sm:p-6">
              <span aria-hidden="true" className="font-serif text-4xl text-gold/80">{String(index + 1).padStart(2, "0")}</span>
              <span aria-hidden="true" className="absolute -right-6 -top-6 h-24 w-24 rounded-full border border-fairway/10 transition-transform duration-500 group-hover:scale-125" />
              <h3 className="relative mt-6 max-w-[22ch] text-base font-semibold leading-6 text-pitch sm:text-lg">{item}</h3>
              <span className="absolute bottom-0 left-0 h-1 w-0 bg-fairway transition-all duration-300 group-hover:w-full" />
            </article>
          ))}
        </div>
        {content.notes.length ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[.34fr_1fr]">
            <div className="rounded-3xl bg-pitch p-5 text-cream sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Before you arrive</p>
              <p className="mt-3 font-serif text-2xl">A little preparation goes a long way.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {content.notes.map((note, index) => <p key={`${note}-${index}`} className="flex items-start gap-3 rounded-3xl border border-line bg-paper p-5 text-sm leading-6 text-ink/75"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-fairway" />{note}</p>)}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
