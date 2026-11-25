import { Page, Program } from "../models/index.js";
import { logger } from "../config/logger.js";

const pages = [
  {
    slug: "home",
    title: "Home",
    heroTitle: "A proper cricket education, from the first grip to match day.",
    heroSubtitle: "Neera Pace trains batters, bowlers and keepers in small groups, with coaches who still love the long net session.",
    bodyHtml: "<p>Morning nets, evening fielding, and a registration desk that answers the phone. The academy keeps one squad list, one attendance book, and a straight answer for every parent.</p>",
  },
  {
    slug: "about",
    title: "About",
    heroTitle: "Built around the nets, not the brochure.",
    heroSubtitle: "Neera Pace is an independent cricket academy for players who want honest coaching and a clear place in a batch.",
    bodyHtml: "<p>We run age-group programs and adult nets on the same ground. Coaches share one attendance record, families get a registration ID, and the office can see who is actually in which squad.</p><p>Version 2 of the academy platform handles admissions, batches and messages. Fees are still settled at the office.</p>",
  },
  {
    slug: "programs",
    title: "Programs",
    heroTitle: "Programs with a real weekly rhythm.",
    heroSubtitle: "Pick the group that matches the player's age and the number of sessions they can attend.",
    bodyHtml: "<p>Every program has a published description. Once a player is approved, the office places them in a batch with a named coach.</p>",
  },
  {
    slug: "coaches",
    title: "Coaches",
    heroTitle: "Coaches who stay with a batch.",
    heroSubtitle: "You will know who runs the session before the first week begins.",
    bodyHtml: "<p>Coach profiles are maintained by the academy office. A coach sees only the players assigned to their batches.</p>",
  },
  {
    slug: "facilities",
    title: "Facilities",
    heroTitle: "Nets, a center wicket, and a room that stores the balls.",
    heroSubtitle: "The ground is simple on purpose: enough lanes for the squads we actually run.",
    bodyHtml: "<h2>On the ground</h2><ul><li>Four turf nets and two concrete lanes</li><li>A center wicket for weekend matches</li><li>Throw-down and fielding squares</li><li>Changing rooms and a kit cage</li></ul><p>Bring white shoes for the turf nets. The office lends a helmet if a junior arrives without one.</p>",
  },
  {
    slug: "gallery",
    title: "Gallery",
    heroTitle: "Sessions, not stock photos.",
    heroSubtitle: "Match days and net mornings from the current season.",
    bodyHtml: "<p>The office publishes photographs from the ground. Updated pictures replace the old file, so the page does not keep a stale image.</p>",
  },
  {
    slug: "contact",
    title: "Contact",
    heroTitle: "Ask the office before you register.",
    heroSubtitle: "Tell us the player's age, the program you have in mind, and when they can train.",
    bodyHtml: "<p>Neera Pace Cricket Academy<br>Ground gate, beside the turf nets<br>Open Monday to Saturday, 6:00–11:00 and 15:30–20:00</p>",
  },
];

const programs = [
  {
    name: "Foundations",
    ageGroup: "Ages 6–10",
    scheduleSummary: "Three evenings a week",
    description: "Grip, stance, and the first straight-bat shots. Groups stay small so every player bowls and bats in the same session.",
    sortOrder: 1,
  },
  {
    name: "Junior match play",
    ageGroup: "Ages 11–14",
    scheduleSummary: "Four sessions plus a weekend game",
    description: "Net craft plus the habits of a real innings: calling, running, and bowling to a field.",
    sortOrder: 2,
  },
  {
    name: "Youth performance",
    ageGroup: "Ages 15–19",
    scheduleSummary: "Morning skills and evening nets",
    description: "For players already in school or club sides. Coaches track attendance and keep the squad list tight.",
    sortOrder: 3,
  },
  {
    name: "Adult nets",
    ageGroup: "Open age",
    scheduleSummary: "Two supervised net nights",
    description: "A booked lane, a coach on the whistle, and no promise of a league team. Come to hit and bowl with intent.",
    sortOrder: 4,
  },
];

export async function ensureContent() {
  for (const page of pages) {
    const exists = await Page.findOne({ slug: page.slug }).select("_id");
    if (!exists) await Page.create({ ...page, published: true });
  }
  const programCount = await Program.countDocuments();
  if (programCount === 0) await Program.insertMany(programs.map((program) => ({ ...program, isPublished: true })));
  logger.info("Academy content is ready");
}
