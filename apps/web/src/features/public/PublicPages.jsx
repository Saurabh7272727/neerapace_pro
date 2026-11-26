import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { enquirySchema } from "@neerapace/shared";
import { Badge, Empty, ErrorNote, PageTitle, RichText, Spinner, inputClass } from "../../components/ui.jsx";
import { api, fieldErrors, imageUrl } from "../../lib/api.js";
import { Button, Field } from "../../components/ui.jsx";
import Demo from '../../saurabhLog/Demo.jsx';
import CricketGallery from '../../saurabhLog/GallerySaurabh.jsx';

function usePage(slug) {
  return useQuery({ queryKey: ["page", slug], queryFn: () => api.get(`/pages/${slug}`) });
}

export function HomePage() {
  const page = usePage("home");
  const programs = useQuery({ queryKey: ["programs"], queryFn: () => api.get("/programs") });
  const announcements = useQuery({ queryKey: ["public-announcements"], queryFn: () => api.get("/announcements/public") });
  return (
    <div>
      <PageTitle title="Home" description="Neera Pace Cricket Academy trains age-group and adult squads." />
      <section className="hero-grid relative overflow-hidden text-cream">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-gold"><span className="h-1.5 w-1.5 rounded-full bg-gold" />Season 2026</div>
            <h1 className="mt-7 font-serif text-5xl leading-[1.02] md:text-7xl">{page.data?.heroTitle || "From the first grip to match day."}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-cream/75">{page.data?.heroSubtitle || "Small squads. Honest coaching. A clear path from net session to match performance."}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/register" className="rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-pitch shadow-xl shadow-gold/20 transition hover:-translate-y-1">Start a registration</Link>
              <Link to="/programs" className="rounded-full border border-cream/25 bg-white/5 px-6 py-3.5 text-sm font-medium backdrop-blur transition hover:border-gold/60">Explore programs</Link>
            </div>
          </div>
          <div className="pitch-stage relative hidden min-h-97.5 lg:block">
            <div className="ball-orb right-6 top-2 z-20" />
            <div className="pitch-card absolute inset-x-8 top-12 rounded-4xl border border-gold/25 bg-pitch-dark/70 p-7 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.22em] text-gold">This week at Neera Pace</p>
              <div className="mt-5 space-y-3">
                {(announcements.data || []).slice(0, 3).map((item) => (
                  <article key={item.id} className="rounded-2xl border border-white/10 bg-white/6 p-4"><h2 className="font-serif text-xl">{item.title}</h2><p className="mt-1 line-clamp-2 text-sm text-cream/65">{item.body}</p></article>
                ))}
                {!announcements.data?.length ? <div className="rounded-2xl border border-white/10 bg-white/6 p-5"><p className="font-serif text-2xl">Next net session</p><p className="mt-2 text-sm text-cream/65">The office will publish the weekly fixture and training notice here.</p></div> : null}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Demo />

      <section className="border-y border-line bg-[#0B1120]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-white">More than a net session</p>
            <h2 className="mt-3 font-serif text-4xl text-white md:text-5xl">Build your game, one session at a time.</h2>
            <p className="mt-4 leading-7 text-white/70">Cricket is a craft: technique, decisions, movement and the confidence to trust your preparation. Training at Neera Pace is designed to help players work on the whole game, at every stage of their journey.</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "Batting & bowling", "Work on the fundamentals and repeat the skills that make you more consistent at the crease and in your bowling spell."],
              ["02", "Fielding & movement", "Practice sharper hands, balanced footwork and the athletic habits that make a difference between the wickets."],
              ["03", "Game awareness", "Learn to read the situation, make a plan and understand how each delivery can change an innings."],
              ["04", "Team habits", "Build communication, discipline and respect for teammates, opponents and the game."],
            ].map(([number, title, body]) => (
              <article key={number} className="rounded-3xl border border-line bg-white p-5">
                <span className="font-serif text-3xl text-gold">{number}</span>
                <h3 className="mt-4 font-serif text-2xl text-pitch">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/70">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

export function StoryPage({ slug }) {
  const page = usePage(slug);
  if (page.isLoading) return <Spinner />;
  if (page.error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorNote error={page.error} /></div>;
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <PageTitle title={page.data.title} description={page.data.heroSubtitle} />
      <p className="text-sm uppercase tracking-[0.18em] text-fairway">{page.data.title}</p>
      <h1 className="mt-2 font-serif text-5xl text-pitch">{page.data.heroTitle}</h1>
      <p className="mt-4 text-lg text-ink/75">{page.data.heroSubtitle}</p>
      <div className="mt-8"><RichText html={page.data.bodyHtml} /></div>
    </article>
  );
}

export function ProgramsPage() {
  const page = usePage("programs");
  const programs = useQuery({ queryKey: ["programs"], queryFn: () => api.get("/programs") });
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <PageTitle title="Programs" description="Age-group and adult cricket programs at Neera Pace." />
      <h1 className="font-serif text-5xl text-pitch">{page.data?.heroTitle || "Programs"}</h1>
      <p className="mt-3 max-w-2xl text-ink/75">{page.data?.heroSubtitle}</p>
      {programs.isLoading ? <Spinner /> : null}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {(programs.data || []).map((program) => (
          <article key={program.id} className="overflow-hidden rounded-3xl border border-line bg-paper">
            {program.imageUrl ? <img src={imageUrl(program.imageUrl, 800)} alt="" className="h-44 w-full object-cover" loading="lazy" /> : null}
            <div className="p-5">
              <Badge tone="gold">{program.ageGroup}</Badge>
              <h2 className="mt-3 font-serif text-3xl text-pitch">{program.name}</h2>
              <p className="mt-2 text-sm">{program.description}</p>
              <p className="mt-3 text-sm text-fairway">{program.scheduleSummary}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CoachesPage() {
  const page = usePage("coaches");
  const coaches = useQuery({ queryKey: ["coaches"], queryFn: () => api.get("/coaches") });
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <PageTitle title="Coaches" description="Coaches at Neera Pace Cricket Academy." />
      <h1 className="font-serif text-5xl text-pitch">{page.data?.heroTitle || "Coaches"}</h1>
      <p className="mt-3 max-w-2xl text-ink/75">{page.data?.heroSubtitle}</p>
      {coaches.isLoading ? <Spinner /> : null}
      {!coaches.data?.length && !coaches.isLoading ? <div className="mt-8"><Empty title="Coaches will appear here" body="The office publishes a profile when a coach is ready to be listed." /></div> : null}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {(coaches.data || []).map((coach) => (
          <article key={coach.id} className="rounded-3xl border border-line bg-paper p-5">
            {coach.avatarUrl ? <img src={imageUrl(coach.avatarUrl, 320)} alt="" className="mb-4 h-16 w-16 rounded-full object-cover" loading="lazy" /> : null}
            <h2 className="font-serif text-2xl text-pitch">{coach.name}</h2>
            <p className="text-sm text-fairway">{coach.specialization || "Academy coach"}</p>
            <p className="mt-3 text-sm text-ink/75">{coach.bio}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-ink/50">{coach.experienceYears} years</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function GalleryPage() {
  const page = usePage("gallery");
  const gallery = useQuery({ queryKey: ["gallery"], queryFn: () => api.get("/gallery") });
  return (
    <>
      <CricketGallery />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <PageTitle title="Gallery" description="Photographs from Neera Pace." />

        {/* Editorial Header */}
        <header className="max-w-2xl border-b border-line pb-6 sm:pb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-pitch/80">
            Archive
          </span>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-pitch sm:text-5xl">
            {page.data?.heroTitle || "Gallery"}
          </h1>
          {page.data?.heroSubtitle ? (
            <p className="mt-3 text-sm leading-relaxed text-ink/75 sm:text-base">
              {page.data.heroSubtitle}
            </p>
          ) : null}
        </header>

        {/* Loading State (Prevents layout shift on mobile & desktop) */}
        {gallery.isLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-3xl border border-line bg-paper"
              >
                <div className="aspect-[4/3] w-full animate-pulse bg-ink/5" />
                <div className="space-y-2 px-5 py-4">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-ink/10" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Empty State */}
        {!gallery.data?.length && !gallery.isLoading ? (
          <div className="mt-8">
            <Empty
              title="No pictures yet"
              body="Match-day photos show up here after the office publishes them."
            />
          </div>
        ) : null}

        {/* Responsive Photo Grid */}
        {gallery.data?.length ? (
          <div className="mt-8 grid grid-cols-1  gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {gallery.data.map((item) => (
              <figure
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-paper transition-all duration-300 hover:-translate-y-0.5 hover:border-pitch/40 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink/5">
                  <img
                    src={imageUrl(item.imageUrl, 700)}
                    alt={item.caption || "Academy photograph"}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  {item.album ? (
                    <span className="absolute top-3 left-3 rounded-full border border-line/80 bg-paper/90 px-3 py-1 text-[11px] font-medium text-pitch backdrop-blur-sm">
                      {item.album}
                    </span>
                  ) : null}
                </div>

                <figcaption className="flex flex-1 items-center justify-between gap-2 px-5 py-3.5 text-sm leading-snug text-ink/90">
                  <span className="line-clamp-2">
                    {item.caption || item.album || "Academy photograph"}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}

export function ContactPage() {
  const page = usePage("contact");
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const parsed = enquirySchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setError(null);
    try {
      await api.post("/enquiries", parsed.data);
      setDone(true);
      event.currentTarget.reset();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageTitle title="Contact" description="Contact Neera Pace Cricket Academy." />

      {/* Top Editorial Header */}
      <div className="max-w-2xl border-b border-line pb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-pitch">
          <span className="h-1.5 w-1.5 rounded-full bg-fairway" />
          Admissions &amp; Ground Desk
        </span>
        <h1 className="mt-4 font-serif text-4xl tracking-tight text-pitch sm:text-5xl">
          {page.data?.heroTitle || "Contact"}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink/75 sm:text-lg">
          {page.data?.heroSubtitle ||
            "Reach out for net trials, seasonal coaching batches, 1-on-1 pace mentorship, or academy visits."}
        </p>
        {page.data?.bodyHtml ? (
          <div className="mt-4 text-sm leading-relaxed text-ink/80">
            <RichText html={page.data?.bodyHtml} />
          </div>
        ) : null}
      </div>

      {/* Main Split Grid: Academy Info (Left) + Enquiry Form (Right) */}
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Location, Coach Desk & Social Media */}
        <div className="order-2 min-w-0 space-y-5 lg:order-1 lg:col-span-5">
          {/* Card 1: Academy Ground & Net Timings */}
          <div className="rounded-3xl border border-line bg-paper p-6 transition-colors hover:border-pitch/35">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-pitch/5 text-pitch">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-pitch/75">
                  Academy Ground
                </p>
                <h2 className="mt-1 font-serif text-xl text-ink">
                  Neera Pace Turf Nets &amp; Arena
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/75">
                  Sector 4 Sports Complex, Civil Lines, Prayagraj, Uttar Pradesh 211001
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/70">
                  <span className="rounded-lg border border-line px-2.5 py-1">
                    Morning: 5:30 AM – 9:30 AM
                  </span>
                  <span className="rounded-lg border border-line px-2.5 py-1">
                    Evening: 4:00 PM – 7:30 PM
                  </span>
                </div>
                <a
                  href="https://maps.google.com/?q=Prayagraj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-pitch hover:underline"
                >
                  Open in Google Maps
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: Head Coach & Direct Contact */}
          <div className="rounded-3xl border border-line bg-paper p-6 transition-colors hover:border-pitch/35">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-pitch/5 font-serif text-base font-bold text-pitch">
                AS
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-pitch/75">
                  Head Coach &amp; Trials Desk
                </p>
                <h2 className="mt-1 font-serif text-xl text-ink">
                  Abhimanyu Singh
                </h2>
                <p className="mt-0.5 text-xs text-ink/65">
                  Founder &amp; Head Pace Coach • Batch Trials &amp; Assessments
                </p>

                <div className="mt-4 space-y-2.5 border-t border-line pt-3.5 text-sm">
                  <a
                    href="tel:+919876543210"
                    className="flex min-w-0 items-center gap-2.5 text-ink/85 transition-colors hover:text-pitch"
                  >
                    <svg className="h-4 w-4 shrink-0 text-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="min-w-0 break-words">+91 7011693617 (Office &amp; WhatsApp)</span>
                  </a>

                  <a
                    href="mailto:office@neerapace.in"
                    className="flex min-w-0 items-center gap-2.5 text-ink/85 transition-colors hover:text-pitch"
                  >
                    <svg className="h-4 w-4 shrink-0 text-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="min-w-0 break-words">neerapacefoundationacademy@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Social Media Channels */}
          <div className="rounded-3xl border border-line bg-paper p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-pitch/75">
                  Community &amp; Drills
                </p>
                <h2 className="mt-1 font-serif text-lg text-ink">
                  Follow Neera Pace
                </h2>
              </div>
              <span className="max-w-full rounded-full border border-line px-3 py-1 text-xs font-medium text-ink/70">
                7.5k students are joined with us
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-2">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/neera_pace_foundation_academy/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-2xl border border-line px-3.5 py-2.5 text-xs font-semibold text-ink transition-all hover:border-pitch hover:bg-pitch/5"
              >
                <svg className="h-4 w-4 shrink-0 text-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                <div className="min-w-0">
                  <div className="truncate">Instagram</div>
                  <div className="text-[11px] font-normal text-ink/60">220K+ Followers</div>
                </div>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/@neerapacefoundation815?si=ydygLYs-A7H717H0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-2xl border border-line px-3.5 py-2.5 text-xs font-semibold text-ink transition-all hover:border-pitch hover:bg-pitch/5"
              >
                <svg className="h-4 w-4 shrink-0 text-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="min-w-0">
                  <div className="truncate">YouTube</div>
                  <div className="text-[11px] font-normal text-ink/60">12K+ Subscribers</div>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/7011693617"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-2xl border border-line px-3.5 py-2.5 text-xs font-semibold text-ink transition-all hover:border-pitch hover:bg-pitch/5"
              >
                <svg className="h-4 w-4 shrink-0 text-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div className="min-w-0">
                  <div className="truncate">WhatsApp</div>
                  <div className="text-[11px] font-normal text-ink/60">Quick Chat</div>
                </div>
              </a>

            </div>
          </div>
        </div>

        {/* Right Column: Polished Enquiry Form (Exact Logic Preserved) */}
        <div className="order-1 min-w-0 lg:order-2 lg:col-span-7">
          <form
            className="space-y-5 rounded-3xl border border-line bg-paper p-6 shadow-sm sm:p-8 lg:p-10"
            onSubmit={onSubmit}
          >
            <div className="border-b border-line pb-5">
              <h2 className="font-serif text-2xl text-pitch sm:text-3xl">
                Send an Enquiry to the Office
              </h2>
              <p className="mt-1.5 text-sm text-ink/70">
                Share the player&apos;s age group, preferred role (batter / pace bowler), or trial date—our desk responds within 24 hours.
              </p>
            </div>

            <Field label="Name" error={errors.name}>
              <input
                className={inputClass}
                name="name"
                placeholder="Player or parent full name"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Email" error={errors.email}>
                <input
                  className={inputClass}
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                />
              </Field>

              <Field label="Phone" error={errors.phone}>
                <input
                  className={inputClass}
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                />
              </Field>
            </div>

            <Field label="Message" error={errors.message}>
              <textarea
                className={inputClass}
                name="message"
                rows={5}
                placeholder="Tell us about your cricket background, batch preference, or question..."
              />
            </Field>

            <ErrorNote error={error} />

            {done ? (
              <div className="flex items-center gap-2.5 rounded-2xl border border-fairway/30 bg-fairway/10 px-4 py-3 text-sm font-medium text-fairway">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>The office has your note.</span>
              </div>
            ) : null}

            <div className="pt-1">
              <Button type="submit" className="w-full sm:w-auto">
                Send to the office
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
