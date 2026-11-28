import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { api, imageUrl } from "../../lib/api.js";

const MAX_BANNERS = 5;

function bannerPlacement(count, index) {
  if (count === 1) {
    return "lg:col-span-12 lg:row-span-2";
  }
  if (count === 2) {
    return "lg:col-span-6 lg:row-span-2";
  }
  if (count === 3 && index === 0) {
    return "lg:col-span-12 lg:row-span-1";
  }
  if (count === 3) {
    return "lg:col-span-6 lg:row-span-1";
  }
  if (count === 4) {
    return "lg:col-span-6 lg:row-span-1";
  }
  if (index === 0) {
    return "lg:col-span-6 lg:row-span-2";
  }
  return "lg:col-span-3 lg:row-span-1";
}

export function HomeBannerSpotlight() {
  const banners = useQuery({
    queryKey: ["banners"],
    queryFn: () => api.get("/banners"),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const items = (banners.data || []).slice(0, MAX_BANNERS);

  return (
    <section
      aria-label="Academy player spotlights"
      className="relative overflow-hidden rounded-[1.5rem] border border-gold/25 bg-gradient-to-b from-pitch-dark/95 via-[#071914] to-[#05120e] p-3 shadow-[0_32px_90px_-35px_rgba(0,0,0,0.88)] sm:rounded-[2rem] sm:p-5"
    >
      {/* Subtle Decorative Ambient Glow & Ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-gold/15 bg-gold/[0.03] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-emerald-500/[0.04] blur-2xl"
      />

      {/* Section Header */}
      <div className="relative mb-3 flex items-center justify-between gap-3 px-1 pt-0.5 sm:mb-4 sm:px-1.5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_10px_rgba(250,204,21,0.75)]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold sm:text-[11px]">
            Neera Pace · Academy Stories
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Swipe Cue */}
          {!banners.isLoading && items.length > 1 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/20 bg-gold/[0.06] px-2.5 py-1 text-[10px] font-medium text-gold/90 lg:hidden">
              Swipe
              <svg
                className="h-3 w-3 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </span>
          ) : null}

          <span className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold tracking-wider text-cream/80 backdrop-blur-sm">
            {items.length}/{MAX_BANNERS}
          </span>
        </div>
      </div>

      {/* Loading Skeleton: Horizontal Carousel on Mobile, Bento Grid on Desktop */}
      {banners.isLoading ? (
        <div
          className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:h-[26rem] lg:grid-cols-12 lg:grid-rows-2 lg:gap-3.5 lg:overflow-visible lg:px-0 lg:pb-0"
          aria-label="Loading player spotlights"
          aria-busy="true"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className={`h-[21rem] w-[78vw] max-w-[310px] shrink-0 snap-center animate-pulse rounded-2xl border border-white/10 bg-white/[0.07] lg:h-auto lg:w-auto lg:max-w-none ${index === 0 ? "lg:col-span-6 lg:row-span-2" : "lg:col-span-3"
                }`}
            />
          ))}
        </div>
      ) : banners.isError && !banners.data ? (
        /* Error State */
        <div
          className="grid min-h-64 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center lg:h-[26rem]"
          role="status"
        >
          <div>
            <p className="text-sm text-cream/80">
              We couldn’t load player spotlights right now.
            </p>
            <button
              type="button"
              onClick={() => banners.refetch()}
              className="mt-3.5 rounded-full border border-gold/45 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20"
            >
              Try again
            </button>
          </div>
        </div>
      ) : items.length ? (
        /* Spotlight Cards: Animated Horizontal Carousel on Mobile (<lg), Editorial Bento Grid on Desktop (lg+) */
        <div className="-mx-3 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-3 pb-1.5 pt-0.5 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:h-[26rem] lg:grid-cols-12 lg:grid-rows-2 lg:gap-3.5 lg:overflow-visible lg:px-0 lg:py-0">
          {items.map((item, index) => {
            const isFeatured = index === 0;
            const metaLine = [item.teamName, item.country]
              .filter(Boolean)
              .join(" · ");

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, x: 24, y: 12, scale: 0.96 }}
                whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.48,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -3, scale: 1.012 }}
                whileTap={{ scale: 0.985 }}
                className={`group relative isolate flex h-[22rem] w-[80vw] max-w-[320px] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-2xl border border-white/12 bg-[#081b15] shadow-[0_14px_34px_-14px_rgba(0,0,0,0.85)] transition-colors duration-300 hover:border-gold/45 lg:h-auto lg:w-auto lg:max-w-none ${bannerPlacement(
                  items.length,
                  index
                )}`}
              >
                {/* Full-Bleed Portrait / Action Media Layer */}
                <div className="absolute inset-0 overflow-hidden bg-[#081b15]">
                  <img
                    src={imageUrl(item.imageUrl, 720)}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full scale-110 object-cover object-top opacity-35 blur-xl"
                  />
                  <img
                    src={imageUrl(item.imageUrl, 720)}
                    alt={`${item.playerName} — ${item.caption}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="relative z-10 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Multi-Stop Editorial Gradient Scrim for Crisp Text Readability */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 z-20 bg-gradient-to-t from-[#04100c] via-[#061712]/70 to-transparent opacity-95"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20 ring-1 ring-inset ring-white/10 transition-all duration-300 group-hover:ring-gold/35"
                  />
                </div>

                {/* Top Tag Badge */}
                {item.tag ? (
                  <span className="absolute left-3 top-3 z-30 max-w-[calc(100%-1.5rem)] truncate rounded-full border border-white/25 bg-[#061813]/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
                    {item.tag}
                  </span>
                ) : null}

                {/* Bottom Player Story Info Overlay */}
                <div className="relative z-30 flex flex-col justify-end p-4 sm:p-4 lg:p-5">
                  <h3
                    className={`truncate font-serif tracking-tight text-white transition-colors duration-300 group-hover:text-gold ${isFeatured
                        ? "text-lg sm:text-xl lg:text-2xl"
                        : "text-base sm:text-lg"
                      }`}
                  >
                    {item.playerName}
                  </h3>

                  <p
                    className={`mt-1 leading-snug text-white/80 ${isFeatured
                        ? "line-clamp-2 text-xs sm:text-sm"
                        : "line-clamp-2 text-xs"
                      }`}
                  >
                    {item.caption}
                  </p>

                  {metaLine ? (
                    <div className="mt-2.5 flex items-center gap-1.5 border-t border-white/10 pt-2">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-gold" />
                      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                        {metaLine}
                      </p>
                    </div>
                  ) : null}
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center lg:h-[26rem]">
          <div>
            <span
              aria-hidden="true"
              className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-gold/25 bg-gold/10 text-xl text-gold"
            >
              ✦
            </span>
            <p className="mt-3 font-serif text-lg text-white">
              Player stories are on the way
            </p>
            <p className="mt-1 text-xs text-cream/55">
              Academy highlights will appear here.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}