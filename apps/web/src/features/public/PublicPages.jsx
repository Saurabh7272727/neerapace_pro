import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { enquirySchema } from "@neerapace/shared";
import { Badge, Empty, ErrorNote, PageTitle, RichText, Spinner, inputClass } from "../../components/ui.jsx";
import { api, fieldErrors, imageUrl } from "../../lib/api.js";
import { Button, Field } from "../../components/ui.jsx";

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
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex items-end justify-between gap-5"><div><p className="text-xs uppercase tracking-[0.2em] text-fairway">Training pathways</p><h2 className="mt-2 font-serif text-4xl text-pitch md:text-5xl">Find your squad</h2></div><Link to="/register" className="hidden text-sm font-medium text-fairway sm:block">Apply for admission →</Link></div>
        <RichText html={page.data?.bodyHtml} />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {(programs.data || []).slice(0, 4).map((program, index) => (
            <article key={program.id} className="card-lift relative overflow-hidden rounded-4xl border border-line bg-paper p-7">
              <span className="absolute -right-3 -top-5 font-serif text-8xl text-pitch/[0.035]">0{index + 1}</span>
              <Badge tone="gold">{program.ageGroup}</Badge>
              <h2 className="mt-5 font-serif text-3xl text-pitch">{program.name}</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-ink/70">{program.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-paper/75">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-fairway">More than a net session</p>
            <h2 className="mt-3 font-serif text-4xl text-pitch md:text-5xl">Build your game, one session at a time.</h2>
            <p className="mt-4 leading-7 text-ink/70">Cricket is a craft: technique, decisions, movement and the confidence to trust your preparation. Training at Neera Pace is designed to help players work on the whole game, at every stage of their journey.</p>
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

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-20">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fairway">Your first innings</p>
          <h2 className="mt-3 font-serif text-4xl text-pitch md:text-5xl">Joining the academy is straightforward.</h2>
          <p className="mt-4 leading-7 text-ink/70">Tell us a little about the player and the program that feels right. The office reviews each verified application and follows up about next steps.</p>
          <Link to="/register" className="mt-6 inline-flex rounded-full bg-pitch px-6 py-3 text-sm font-semibold text-cream transition hover:bg-pitch-dark">Start your application</Link>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            ["Choose a pathway", "Explore the programs and select the best fit for the player."],
            ["Send the details", "Complete the registration form to receive an application ID."],
            ["Verify & hear back", "Confirm the email address; the academy office will review the application."],
          ].map(([title, body], index) => (
            <li key={title} className="rounded-3xl border border-line bg-paper p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/25 font-semibold text-pitch">{index + 1}</span>
              <h3 className="mt-5 font-serif text-2xl text-pitch">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/70">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="hero-grid px-5 py-14 text-cream sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Ready when you are</p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl">Make the next practice count.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-cream/70">Have a question before applying? Get in touch with the academy team.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-pitch">Apply for admission</Link>
            <Link to="/contact" className="rounded-full border border-cream/25 px-5 py-3 text-sm font-medium text-cream hover:border-gold/60">Contact the academy</Link>
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
    <section className="mx-auto max-w-6xl px-4 py-16">
      <PageTitle title="Gallery" description="Photographs from Neera Pace." />
      <h1 className="font-serif text-5xl text-pitch">{page.data?.heroTitle || "Gallery"}</h1>
      <p className="mt-3 max-w-2xl text-ink/75">{page.data?.heroSubtitle}</p>
      {!gallery.data?.length && !gallery.isLoading ? <div className="mt-8"><Empty title="No pictures yet" body="Match-day photos show up here after the office publishes them." /></div> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(gallery.data || []).map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-3xl border border-line bg-paper">
            <img src={imageUrl(item.imageUrl, 700)} alt={item.caption || "Academy photograph"} className="h-56 w-full object-cover" loading="lazy" />
            <figcaption className="px-4 py-3 text-sm">{item.caption || item.album}</figcaption>
          </figure>
        ))}
      </div>
    </section>
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
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
      <PageTitle title="Contact" description="Contact Neera Pace Cricket Academy." />
      <div>
        <h1 className="font-serif text-5xl text-pitch">{page.data?.heroTitle || "Contact"}</h1>
        <p className="mt-3 text-ink/75">{page.data?.heroSubtitle}</p>
        <div className="mt-6"><RichText html={page.data?.bodyHtml} /></div>
      </div>
      <form className="space-y-4 rounded-3xl border border-line bg-paper p-6" onSubmit={onSubmit}>
        <Field label="Name" error={errors.name}><input className={inputClass} name="name" /></Field>
        <Field label="Email" error={errors.email}><input className={inputClass} name="email" type="email" /></Field>
        <Field label="Phone" error={errors.phone}><input className={inputClass} name="phone" /></Field>
        <Field label="Message" error={errors.message}><textarea className={inputClass} name="message" rows={5} /></Field>
        <ErrorNote error={error} />
        {done ? <p className="text-sm text-fairway">The office has your note.</p> : null}
        <Button type="submit">Send to the office</Button>
      </form>
    </section>
  );
}
