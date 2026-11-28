import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { api, imageUrl } from "../../lib/api.js";

const MAX_BANNERS = 5;

function bannerPlacement(count, index) {
  if (count === 1) return "col-span-2 aspect-[4/3] min-h-[16rem] lg:col-span-12 lg:row-span-2 lg:aspect-auto lg:min-h-0";
  if (count === 2) return "aspect-[4/3] min-h-[16rem] lg:col-span-6 lg:row-span-2 lg:aspect-auto lg:min-h-0";
  if (count === 3 && index === 0) return "col-span-2 aspect-[4/3] min-h-[16rem] lg:col-span-12 lg:aspect-auto lg:min-h-0";
  if (count === 3) return "aspect-[4/3] min-h-[16rem] lg:col-span-6 lg:aspect-auto lg:min-h-0";
  if (count === 4) return "aspect-[4/3] min-h-[16rem] lg:col-span-6 lg:aspect-auto lg:min-h-0";
  if (index === 0) return "aspect-[4/3] min-h-[16rem] lg:col-span-6 lg:row-span-2 lg:aspect-auto lg:min-h-0";
  return "aspect-[4/3] min-h-[16rem] lg:col-span-3 lg:aspect-auto lg:min-h-0";
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
    <section aria-label="Academy player spotlights" className="relative overflow-hidden rounded-[1.5rem] border border-gold/25 bg-pitch-dark/75 p-2.5 shadow-[0_30px_90px_-40px_rgba(0,0,0,.8)] sm:rounded-[2rem] sm:p-4">
      <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full border border-gold/10" />
      <div className="relative mb-2.5 flex items-end justify-between gap-3 px-1 pt-1 sm:mb-4 sm:px-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Neera Pace · Academy stories</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-medium text-cream/70">{items.length}/{MAX_BANNERS}</span>
      </div>

      {banners.isLoading ? (
        <div className="grid grid-cols-2 gap-2 lg:h-[22rem] lg:grid-cols-12 lg:grid-rows-2" aria-label="Loading player spotlights" aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => <div key={index} className={`min-h-[16rem] animate-pulse rounded-2xl bg-white/10 lg:min-h-0 ${index === 0 ? "aspect-[4/3] lg:col-span-6 lg:row-span-2 lg:aspect-auto" : "aspect-[4/3] lg:col-span-3 lg:aspect-auto"}`} />)}
        </div>
      ) : banners.isError && !banners.data ? (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center lg:h-[22rem]" role="status">
          <div>
            <p className="text-sm text-cream/75">We couldn’t load player spotlights right now.</p>
            <button type="button" onClick={() => banners.refetch()} className="mt-3 rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold/10">Try again</button>
          </div>
        </div>
      ) : items.length ? (
        <div className="grid grid-cols-2 gap-2 lg:h-[22rem] lg:grid-cols-12 lg:grid-rows-2">
          {items.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.42, delay: index * 0.07, ease: "easeOut" }}
              whileHover={{ y: -3, scale: 1.015 }}
              className={`group relative isolate flex min-w-0 flex-col overflow-hidden rounded-2xl bg-[#091d18] ${bannerPlacement(items.length, index)}`}
            >
              <div className="relative min-h-0 flex-1 overflow-hidden bg-[#091d18]">
                <img
                  src={imageUrl(item.imageUrl, 720)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full scale-110 object-cover object-top opacity-40 blur-xl"
                />
                <img
                  src={imageUrl(item.imageUrl, 720)}
                  alt={`${item.playerName} — ${item.caption}`}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 z-10 h-full w-full object-cover object-top"
                />
                {item.tag ? <span className="absolute left-2 top-2 z-20 max-w-[calc(100%-1rem)] truncate rounded-full border border-white/25 bg-pitch/75 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur sm:left-3 sm:top-3 sm:px-3 sm:text-[10px]">{item.tag}</span> : null}
              </div>
              <div className="relative z-20 shrink-0 bg-[#081b15]/95 p-2.5 sm:p-3.5">
                <h3 className="truncate font-serif text-sm text-white sm:text-base lg:text-lg">{item.playerName}</h3>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-white/75 sm:text-xs">{item.caption}</p>
                {[item.teamName, item.country].filter(Boolean).length ? <p className="mt-1.5 truncate text-[9px] font-semibold uppercase tracking-wider text-gold sm:text-[10px]">{[item.teamName, item.country].filter(Boolean).join(" · ")}</p> : null}
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center lg:h-[22rem]">
          <div>
            <span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-gold/25 bg-gold/10 text-xl text-gold">✦</span>
            <p className="mt-3 font-serif text-lg text-white">Player stories are on the way</p>
            <p className="mt-1 text-xs text-cream/55">Academy highlights will appear here.</p>
          </div>
        </div>
      )}
    </section>
  );
}
