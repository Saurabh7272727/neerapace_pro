import React, { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * ============================================================================
 * 1. PRIMARY WIDE SQUAD SHOWCASE CONFIG
 * Replace `src` with your client's wide team/squad `.webp` photo
 * (e.g. "/assets/neerapace-squad-2026.webp") and fine-tune pin coordinates.
 * ============================================================================
 */
const PRIMARY_SQUAD_PHOTO = {
    id: 'squad-master-2026',
    title: 'MRF Sarfaraz in MRF',
    subtitle: '2026 High-Performance Cricket Team',
    category: 'Cricket Team',
    date: 'Season 2018',
    telemetry: 'FULL TEAM • 11 MEMBERS',
    location: 'Main Center Turf',
    filename: 'neerapace-official-squad-2026.webp',
    src: 'https://res.cloudinary.com/nwd62j6r/image/upload/v1795719044/IMG_9959.jpg',
};

/**
 * ============================================================================
 * 2. GALLERY MOMENTS DEMO ARRAY (`INITIAL_GALLERY_ITEMS`)
 * Replace `src` links with your compressed `.webp` or Cloudinary URLs later.
 * `bentoSpan` controls the Editorial Bento layout ('wide' | 'tall' | 'standard').
 * ============================================================================
 */
const INITIAL_GALLERY_ITEMS = [
    {
        id: 'moment-01',
        title: 'Emerging Player of the tournament',
        category: 'Match Days',
        date: 'Nov 2026',
        telemetry: 'BAJAJ Pulsar',
        location: 'Rahul Yadav (Janakpur Bolts)',
        bentoSpan: 'wide',
        filename: 'IMG_9948.jpg',
        src: 'https://res.cloudinary.com/nwd62j6r/image/upload/v1795719687/IMG_9948.jpg',
    },
    {
        id: 'moment-02',
        title: 'Krishna Kumar Saroj selected as a net bowler IPL 2026 for PBKS',
        category: 'Cricket Bolts',
        date: 'Nov 2026',
        telemetry: 'Punjab Kings (IPL 2026)',
        location: 'Pratapgarh UP',
        bentoSpan: 'tall',
        filename: 'IMG_9954.jpg',
        src: 'https://res.cloudinary.com/nwd62j6r/image/upload/v1795720126/IMG_9954.jpg',
    },
    {
        id: 'moment-03',
        title: 'Amit Kumar with 2023 Jharkhand team players',
        category: 'Match Days',
        date: 'Nov 2026',
        telemetry: 'Vijay Hazare Trophy',
        location: 'M.S. DHONI PAVILION',
        bentoSpan: 'standard',
        filename: 'neerapace-outswing-release.webp',
        src: 'https://res.cloudinary.com/nwd62j6r/image/upload/v1795720585/IMG_9958.jpg',
    },
    {
        id: 'moment-04',
        title: 'Neelesh Rai was selected by the RR as left-arm fast net bowler for IPL 2025',
        category: 'Match Days',
        date: '2025',
        telemetry: 'IPL 2025 season ',
        location: 'Met with Rohit sharma sir',
        bentoSpan: 'tall',
        filename: 'neerapace-selection-trial-xi.webp',
        src: 'https://res.cloudinary.com/nwd62j6r/image/upload/v1795720547/IMG_9955.jpg',
    },
    {
        id: 'moment-05',
        title: 'Close-In Slip Catching & Reflex Reaction',
        category: 'Fitness',
        date: 'Oct 2026',
        telemetry: '0.28S REACTION • SLIP CORDON',
        location: 'Practice Apron',
        bentoSpan: 'standard',
        filename: 'neerapace-slip-reflex-drills.webp',
        src: 'https://images.unsplash.com/photo-1593766827228-8737b4534aa6?auto=format&fit=crop&w=1000&q=80',
    },
    {
        id: 'moment-06',
        title: 'Krishna Kumar Saroj with PBKS head coach Ricky Ponting',
        category: 'Match Days',
        date: 'Sep 2026',
        telemetry: 'IPL 2026 ',
        location: 'Training alongside with team',
        bentoSpan: 'standard',
        filename: 'neerapace-spin-strike-rotation.webp',
        src: 'https://res.cloudinary.com/nwd62j6r/image/upload/v1795720561/IMG_9956.jpg',
    },
    {
        id: 'moment-07',
        title: 'Blockhole Cone Target Death-Over Drill',
        category: 'Net Practice',
        date: 'Sep 2026',
        telemetry: 'YORKER ZONE • 18/24 HITS',
        location: 'Turf Net 3',
        bentoSpan: 'standard',
        filename: 'neerapace-yorker-cone-drill.webp',
        src: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80',
    },
    {
        id: 'moment-08',
        title: 'Krishna Kumar Saroj with PBKS head coach Ricky Ponting',
        category: 'Match Days',
        date: 'Sep 2026',
        telemetry: 'IPL 2026 ',
        location: 'Training alongside with team',
        bentoSpan: 'standard',
        filename: 'neerapace-weekend-league.webp',
        src: 'https://res.cloudinary.com/nwd62j6r/image/upload/v1795720574/IMG_9957.jpg',
    },
    {
        id: 'moment-09',
        title: 'Man of the match in Under-16 in the 2026-27 domestic season',
        category: 'Batting',
        date: 'Aug 2026',
        telemetry: 'LEFT-HANDED • DIRECT HIT',
        location: 'Yash N Choudhary(Himachal Pradesh) is a left-handed batter and bowler',
        bentoSpan: 'standard',
        filename: 'neerapace-sprint-direct-hit.webp',
        src: 'https://res.cloudinary.com/nwd62j6r/image/upload/v1795720515/IMG_9950.jpg',
    },
];

const CATEGORIES = ['All', 'Net Practice', 'Batting', 'Match Days', 'Fitness'];
const STORAGE_KEY = 'neerapace_saved_moments';

/**
 * ============================================================================
 * 3. SELF-CONTAINED INLINE SVG ICONS (ZERO EXTERNAL ICON DEPENDENCIES)
 * ============================================================================
 */
function EyeIcon({ className = 'w-4 h-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
        </svg>
    );
}

function DownloadIcon({ className = 'w-4 h-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
        </svg>
    );
}

function BookmarkIcon({ filled = false, className = 'w-4 h-4' }) {
    return (
        <svg
            className={className}
            fill={filled ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
        </svg>
    );
}

function SearchIcon({ className = 'w-4 h-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
            />
        </svg>
    );
}

function BentoLayoutIcon({ className = 'w-4 h-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="10" height="8" rx="1.5" />
            <rect x="15" y="3" width="6" height="18" rx="1.5" />
            <rect x="3" y="13" width="10" height="8" rx="1.5" />
        </svg>
    );
}

function GridLayoutIcon({ className = 'w-4 h-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    );
}

function ZoomIcon({ zoomed = false, className = 'w-4 h-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M8 11h6" />
            {!zoomed && <path strokeLinecap="round" strokeLinejoin="round" d="M11 8v6" />}
        </svg>
    );
}

function CloseIcon({ className = 'w-5 h-5' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function ChevronLeftIcon({ className = 'w-5 h-5' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function ChevronRightIcon({ className = 'w-5 h-5' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    );
}

function SpinnerIcon({ className = 'w-4 h-4' }) {
    return (
        <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
                className="opacity-85"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}

function CameraFallbackIcon({ className = 'w-6 h-6' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

/**
 * ============================================================================
 * 4. GALLERY MOMENT CARD COMPONENT
 * Implements React lazy-loading (`loading="lazy" decoding="async"`), shimmer
 * skeleton, error fallback, telemetry stamp, Kit Bag bookmark, and download.
 * ============================================================================
 */
function MomentCard({
    item,
    viewMode,
    isSaved,
    isDownloading,
    onToggleSave,
    onPreview,
    onDownload,
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const spanClasses = useMemo(() => {
        if (viewMode === 'grid') return 'col-span-1';
        if (item.bentoSpan === 'wide') return 'sm:col-span-2 lg:col-span-8';
        if (item.bentoSpan === 'tall') return 'sm:col-span-1 lg:col-span-4 lg:row-span-2';
        return 'sm:col-span-1 lg:col-span-4';
    }, [viewMode, item.bentoSpan]);

    const heightClasses = useMemo(() => {
        if (viewMode === 'grid') return 'h-60 sm:h-64';
        if (item.bentoSpan === 'tall') return 'h-64 sm:h-72 lg:h-full lg:min-h-[536px]';
        return 'h-60 sm:h-64';
    }, [viewMode, item.bentoSpan]);

    return (
        <article
            className={`group relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-colors duration-200 hover:border-slate-700 ${spanClasses}`}
        >
            <div
                role="button"
                tabIndex={0}
                onClick={() => onPreview(item)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onPreview(item);
                    }
                }}
                aria-label={`Preview ${item.title}`}
                className={`relative w-full flex-1 cursor-pointer overflow-hidden bg-slate-950 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 ${heightClasses}`}
            >
                {/* Shimmer Skeleton Placeholder */}
                {!isLoaded && !hasError && (
                    <div className="absolute inset-0 animate-pulse bg-slate-800/90" />
                )}

                {hasError ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 p-6 text-center">
                        <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-emerald-500">
                            <CameraFallbackIcon className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                        <p className="mt-1 text-[11px] text-slate-500">NeeraPace Archive</p>
                    </div>
                ) : (
                    <img
                        src={item.src}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setIsLoaded(true)}
                        onError={() => {
                            setHasError(true);
                            setIsLoaded(true);
                        }}
                        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${isLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                    />
                )}

                {/* Matte Gradient Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1120]/95 via-[#0B1120]/25 to-transparent" />

                {/* Top-Left Category & Telemetry Stamps */}
                <div className="absolute top-3 left-3 flex max-w-[calc(100%-6.75rem)] flex-wrap items-center gap-1.5">
                    <span className="rounded border border-slate-700/80 bg-[#0B1120]/90 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                        {item.category}
                    </span>
                    <span className="truncate rounded border border-amber-400/25 bg-[#0B1120]/85 px-2 py-0.5 font-mono text-[10px] font-medium text-amber-400">
                        {item.telemetry}
                    </span>
                </div>

                {/* Top-Right Quick Actions (Save, Preview, Download) */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSave(item.id);
                        }}
                        title={isSaved ? 'Remove from Kit Bag' : 'Save to Kit Bag'}
                        aria-label={isSaved ? 'Remove from Kit Bag' : 'Save to Kit Bag'}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${isSaved
                            ? 'border-amber-400/60 bg-amber-400/15 text-amber-400'
                            : 'border-slate-700 bg-[#0B1120]/90 text-slate-300 hover:border-slate-500 hover:text-white'
                            }`}
                    >
                        <BookmarkIcon filled={isSaved} className="h-3.5 w-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPreview(item);
                        }}
                        title="Preview Image"
                        aria-label={`Preview ${item.title}`}
                        className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-[#0B1120]/90 text-slate-300 transition-colors hover:border-emerald-500/60 hover:text-emerald-400 sm:flex"
                    >
                        <EyeIcon className="h-3.5 w-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDownload(item);
                        }}
                        disabled={isDownloading}
                        title="Download Photo"
                        aria-label={`Download ${item.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-[#0B1120]/90 text-slate-300 transition-colors hover:border-emerald-500/60 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isDownloading ? (
                            <SpinnerIcon className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                            <DownloadIcon className="h-3.5 w-3.5" />
                        )}
                    </button>
                </div>

                {/* Bottom Caption & Location */}
                <div className="absolute right-3.5 bottom-3 left-3.5">
                    <h3 className="line-clamp-1 text-sm font-semibold text-slate-100 sm:text-[15px]">
                        {item.title}
                    </h3>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-400">
                        <span className="truncate">{item.location}</span>
                        <span className="shrink-0">{item.date}</span>
                    </div>
                </div>
            </div>
        </article>
    );
}

/**
 * ============================================================================
 * 5. STANDALONE NAVBAR-FREE GALLERY COMPONENT (`CricketGallery`)
 * Drops cleanly into any route or page on neerapace.in.
 * ============================================================================
 */
export function CricketGallery() {
    // Filter, Search & Layout Mode States
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('bento'); // 'bento' | 'grid'

    // Primary Squad Photo loading states
    const [squadLoaded, setSquadLoaded] = useState(false);
    const [squadError, setSquadError] = useState(false);

    // Saved Kit Bag (Persisted in localStorage under `neerapace_saved_moments`)
    const [savedIds, setSavedIds] = useState(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
        } catch {
            // Ignore storage quota or sandbox restrictions safely
        }
    }, [savedIds]);

    // Pro Lightbox Studio States
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

    // Download & Toast Feedback States
    const [downloadingId, setDownloadingId] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(''), 3000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    const toggleSaveMoment = useCallback((id) => {
        setSavedIds((prev) => {
            const exists = prev.includes(id);
            const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
            setToastMessage(exists ? 'Removed from Kit Bag' : 'Saved to Kit Bag');
            return next;
        });
    }, []);

    const getCategoryCount = useCallback((category) => {
        if (category === 'All') return INITIAL_GALLERY_ITEMS.length;
        return INITIAL_GALLERY_ITEMS.filter((item) => item.category === category).length;
    }, []);

    const filteredItems = useMemo(() => {
        return INITIAL_GALLERY_ITEMS.filter((item) => {
            if (showSavedOnly && !savedIds.includes(item.id)) return false;
            if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return (
                    item.title.toLowerCase().includes(q) ||
                    item.category.toLowerCase().includes(q) ||
                    item.telemetry.toLowerCase().includes(q) ||
                    item.location.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [selectedCategory, showSavedOnly, savedIds, searchQuery]);

    // Combined Lightbox Studio Playlist (Primary Squad Photo + Filtered Items)
    const studioItems = useMemo(
        () => [PRIMARY_SQUAD_PHOTO, ...filteredItems],
        [filteredItems]
    );

    const activeStudioItem = lightboxIndex !== null ? studioItems[lightboxIndex] : null;

    const openLightbox = useCallback(
        (targetItem) => {
            const idx = studioItems.findIndex((entry) => entry.id === targetItem.id);
            if (idx !== -1) {
                setIsZoomed(false);
                setZoomOrigin({ x: 50, y: 50 });
                setLightboxIndex(idx);
            }
        },
        [studioItems]
    );

    const closeLightbox = useCallback(() => {
        setLightboxIndex(null);
        setIsZoomed(false);
    }, []);

    const stepPrev = useCallback(() => {
        setIsZoomed(false);
        setLightboxIndex((prev) =>
            prev === null ? null : (prev - 1 + studioItems.length) % studioItems.length
        );
    }, [studioItems.length]);

    const stepNext = useCallback(() => {
        setIsZoomed(false);
        setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % studioItems.length));
    }, [studioItems.length]);

    // Keyboard Controls in Lightbox: Escape, ArrowLeft, ArrowRight, Z
    useEffect(() => {
        if (lightboxIndex === null) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') stepPrev();
            if (e.key === 'ArrowRight') stepNext();
            if (e.key === 'z' || e.key === 'Z') {
                setIsZoomed((prev) => !prev);
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [lightboxIndex, closeLightbox, stepPrev, stepNext]);

    // Cursor-guided panning while zoomed at 2x
    const handleZoomMouseMove = (e) => {
        if (!isZoomed) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomOrigin({
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
        });
    };

    /**
     * One-Click Blob Download Handler with Automatic New-Tab Fallback
     */
    const handleDownload = async (item) => {
        if (!item || downloadingId === item.id) return;
        setDownloadingId(item.id);

        try {
            const response = await fetch(item.src, { mode: 'cors' });
            if (!response.ok) throw new Error('Download response error');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const ext = blob.type.includes('webp')
                ? 'webp'
                : blob.type.includes('png')
                    ? 'png'
                    : 'jpg';
            const downloadName =
                item.filename || `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`;

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = downloadName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
            setToastMessage(`Downloaded "${item.title}"`);
        } catch {
            window.open(item.src, '_blank', 'noopener,noreferrer');
            setToastMessage('Opened full-resolution photo in a new tab');
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <section
            aria-label="NeeraPace Cricket Academy Gallery"
            className="w-full overflow-x-hidden bg-[#0B1120]/99 py-8 text-slate-100 antialiased selection:bg-emerald-600 selection:text-white sm:py-12 lg:py-14"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* ===================================================================
            1. TOP SECTION HEADER (NAVBAR-FREE)
        ==================================================================== */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:mb-10 sm:flex-row sm:items-end">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Official Media Archive
                        </span>
                        <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Moments From The Pitch
                        </h1>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm lg:text-base">
                            Real turf net sessions, fast-bowling spells, batting drills, and squad match days at
                            NeeraPace Cricket Academy.
                        </p>
                    </div>

                    {/* Saved Kit Bag Counter Pill */}
                    <div className="shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowSavedOnly((prev) => !prev)}
                            aria-pressed={showSavedOnly}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm ${showSavedOnly
                                ? 'border-amber-400/60 bg-amber-400/15 text-amber-300'
                                : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700 hover:text-white'
                                }`}
                        >
                            <BookmarkIcon filled={savedIds.length > 0} className="h-4 w-4 text-amber-400" />
                            <span>Saved Kit Bag</span>
                            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-bold text-amber-400">
                                {savedIds.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* ===================================================================
            2. PRIMARY WIDE SQUAD SHOWCASE (`PRIMARY_SQUAD_PHOTO`)
        ==================================================================== */}
                <div className="mb-10 sm:mb-12">
                    <div className="mb-3.5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-[11px] font-semibold tracking-wider text-amber-400 uppercase">
                                Featured Academy Squad
                            </p>
                            <h2 className="text-base font-bold text-white sm:text-lg">
                                {PRIMARY_SQUAD_PHOTO.title}
                            </h2>
                        </div>

                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 sm:rounded-2xl">
                        {/* Responsive Wide Frame: 4:3 on Mobile, 16:9 on Tablet, 21:9 on Desktop */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950 sm:aspect-[16/9] lg:aspect-[21/9]">
                            {!squadLoaded && !squadError && (
                                <div className="absolute inset-0 animate-pulse bg-slate-800/90" />
                            )}

                            {squadError ? (
                                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 p-6 text-center">
                                    <CameraFallbackIcon className="h-8 w-8 text-emerald-500" />
                                    <p className="mt-2 text-sm font-semibold text-slate-200">
                                        {PRIMARY_SQUAD_PHOTO.title}
                                    </p>
                                </div>
                            ) : (
                                <img
                                    src={PRIMARY_SQUAD_PHOTO.src}
                                    alt={PRIMARY_SQUAD_PHOTO.title}
                                    decoding="async"
                                    onLoad={() => setSquadLoaded(true)}
                                    onError={() => {
                                        setSquadError(true);
                                        setSquadLoaded(true);
                                    }}
                                    className={`h-full w-full object-cover object-center transition-opacity duration-500 ${squadLoaded ? 'opacity-100' : 'opacity-0'
                                        }`}
                                />
                            )}

                            {/* Subtle Matte Vignette */}
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1120]/90 via-transparent to-[#0B1120]/30" />

                            {/* Top-Left Telemetry Stamp */}
                            <div className="absolute inset-x-0 top-0 flex flex-wrap items-start gap-1.5 p-2.5 sm:inset-x-auto sm:left-3 sm:top-3 sm:gap-2 sm:p-0">
                                <span className="max-w-full rounded border border-slate-700/80 bg-[#0B1120]/90 px-2 py-1 font-mono text-[9px] font-medium text-amber-400 sm:px-2.5 sm:text-[11px]">
                                    {PRIMARY_SQUAD_PHOTO.telemetry}
                                </span>
                                <span className="hidden rounded border border-slate-800 bg-[#0B1120]/85 px-2.5 py-1 text-[11px] text-slate-300 sm:inline-block">
                                    {PRIMARY_SQUAD_PHOTO.location}
                                </span>
                            </div>

                        </div>

                        {/* Bottom Action Bar (Wraps cleanly on 320px Mobile) */}
                        <div className="flex flex-col justify-between gap-3 border-t border-slate-800 bg-slate-900 px-3.5 py-3.5 sm:flex-row sm:items-center sm:px-6">
                            <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">{PRIMARY_SQUAD_PHOTO.subtitle}</p>

                            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:items-center sm:gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => openLightbox(PRIMARY_SQUAD_PHOTO)}
                                    className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-[#0B1120] px-2 py-2.5 text-[11px] font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800 sm:px-3.5 sm:py-2 sm:text-sm"
                                >
                                    <EyeIcon className="h-4 w-4 text-emerald-400" />
                                    <span>Fullscreen Preview</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDownload(PRIMARY_SQUAD_PHOTO)}
                                    disabled={downloadingId === PRIMARY_SQUAD_PHOTO.id}
                                    className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3.5 sm:py-2 sm:text-sm"
                                >
                                    {downloadingId === PRIMARY_SQUAD_PHOTO.id ? (
                                        <SpinnerIcon className="h-4 w-4" />
                                    ) : (
                                        <DownloadIcon className="h-4 w-4" />
                                    )}
                                    <span>Download</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===================================================================
            3. FILTER, SEARCH & LAYOUT VIEW CONTROLS (MOBILE-SAFE)
        ==================================================================== */}
                <div className="mb-6 space-y-3.5 sm:mb-8">
                    {/* Horizontally Scrollable Category Tabs + Saved Toggle */}
                    <div
                        role="tablist"
                        aria-label="Filter gallery by category"
                        className="flex items-center gap-2 overflow-x-auto pb-1.5"
                    >
                        {CATEGORIES.map((category) => {
                            const isActive = !showSavedOnly && selectedCategory === category;
                            const count = getCategoryCount(category);

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => {
                                        setShowSavedOnly(false);
                                        setSelectedCategory(category);
                                    }}
                                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${isActive
                                        ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
                                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                        }`}
                                >
                                    <span>{category}</span>
                                    <span
                                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${isActive
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : 'bg-slate-800 text-slate-400'
                                            }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => setShowSavedOnly((prev) => !prev)}
                            aria-pressed={showSavedOnly}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${showSavedOnly
                                ? 'border-amber-400/60 bg-amber-400/15 text-amber-300'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                }`}
                        >
                            <BookmarkIcon filled={showSavedOnly} className="h-3.5 w-3.5 text-amber-400" />
                            <span>Saved</span>
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                                {savedIds.length}
                            </span>
                        </button>
                    </div>

                    {/* Search Input & Layout Switcher (Stacks cleanly on 320px Mobile) */}
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-xs">
                            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search drill, net, pace..."
                                aria-label="Search cricket moments"
                                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pr-8 pl-9 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none sm:text-sm"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search"
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    <CloseIcon className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <div
                            role="group"
                            aria-label="Gallery layout mode"
                            className="grid grid-cols-2 rounded-lg border border-slate-800 bg-slate-900 p-0.5 sm:inline-flex"
                        >
                            <button
                                type="button"
                                onClick={() => setViewMode('bento')}
                                className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'bento'
                                    ? 'bg-slate-800 text-emerald-400'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <BentoLayoutIcon className="h-3.5 w-3.5" />
                                <span>Editorial Bento</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'grid'
                                    ? 'bg-slate-800 text-emerald-400'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <GridLayoutIcon className="h-3.5 w-3.5" />
                                <span>Uniform Grid</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ===================================================================
            4. RESPONSIVE GALLERY GRID (1-COL MOBILE -> 2-COL TABLET -> DESKTOP)
        ==================================================================== */}
                {filteredItems.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-14 text-center">
                        <p className="text-sm font-semibold text-slate-200 sm:text-base">
                            {showSavedOnly
                                ? 'Your Kit Bag has no saved photos yet.'
                                : 'No cricket moments matched your filter.'}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
                            {showSavedOnly
                                ? 'Tap the bookmark icon on any photo to save it here for quick download.'
                                : 'Try clearing your search or switching back to All moments.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setShowSavedOnly(false);
                                setSelectedCategory('All');
                                setSearchQuery('');
                            }}
                            className="mt-4 rounded-lg border border-slate-700 bg-[#0B1120] px-4 py-2 text-xs font-semibold text-emerald-400 hover:border-emerald-500/50"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div
                        className={
                            viewMode === 'bento'
                                ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-12'
                                : 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3'
                        }
                    >
                        {filteredItems.map((item) => (
                            <MomentCard
                                key={item.id}
                                item={item}
                                viewMode={viewMode}
                                isSaved={savedIds.includes(item.id)}
                                isDownloading={downloadingId === item.id}
                                onToggleSave={toggleSaveMoment}
                                onPreview={openLightbox}
                                onDownload={handleDownload}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* =====================================================================
          5. PRO LIGHTBOX STUDIO MODAL (1x/2x ZOOM, TELEMETRY, FILMSTRIP)
      ====================================================================== */}
            {activeStudioItem && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={activeStudioItem.title}
                    onClick={closeLightbox}
                    className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0B1120]/96 p-3 backdrop-blur-md sm:p-5"
                >
                    {/* Studio Header */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2.5 border-b border-slate-800 pb-3"
                    >
                        <div className="flex min-w-0 items-center gap-2.5">
                            <span className="shrink-0 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs font-semibold text-emerald-400">
                                {lightboxIndex + 1} / {studioItems.length}
                            </span>
                            <div className="min-w-0">
                                <h2 className="truncate text-sm font-bold text-white sm:text-base">
                                    {activeStudioItem.title}
                                </h2>
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                                    <span className="font-mono text-amber-400">{activeStudioItem.telemetry}</span>
                                    <span>&bull;</span>
                                    <span>{activeStudioItem.location}</span>
                                </div>
                            </div>
                        </div>

                        {/* Studio Controls */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                                type="button"
                                onClick={() => setIsZoomed((prev) => !prev)}
                                title="Toggle 1x / 2x Zoom (Shortcut: Z)"
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${isZoomed
                                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
                                    : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
                                    }`}
                            >
                                <ZoomIcon zoomed={isZoomed} className="h-4 w-4" />
                                <span>{isZoomed ? '2x' : '1x'}</span>
                            </button>

                            {activeStudioItem.id !== PRIMARY_SQUAD_PHOTO.id && (
                                <button
                                    type="button"
                                    onClick={() => toggleSaveMoment(activeStudioItem.id)}
                                    title="Save to Kit Bag"
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${savedIds.includes(activeStudioItem.id)
                                        ? 'border-amber-400/60 bg-amber-400/15 text-amber-300'
                                        : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
                                        }`}
                                >
                                    <BookmarkIcon
                                        filled={savedIds.includes(activeStudioItem.id)}
                                        className="h-4 w-4 text-amber-400"
                                    />
                                    <span className="hidden sm:inline">
                                        {savedIds.includes(activeStudioItem.id) ? 'Saved' : 'Save'}
                                    </span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => handleDownload(activeStudioItem)}
                                disabled={downloadingId === activeStudioItem.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60 sm:text-sm"
                            >
                                {downloadingId === activeStudioItem.id ? (
                                    <SpinnerIcon className="h-4 w-4" />
                                ) : (
                                    <DownloadIcon className="h-4 w-4" />
                                )}
                                <span>Download</span>
                            </button>

                            <button
                                type="button"
                                onClick={closeLightbox}
                                aria-label="Close studio lightbox"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                            >
                                <CloseIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Center Interactive Image Stage */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative mx-auto my-auto flex w-full max-w-6xl flex-1 items-center justify-center overflow-hidden py-2"
                    >
                        <button
                            type="button"
                            onClick={stepPrev}
                            aria-label="Previous photo"
                            className="absolute left-1 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 transition-colors hover:border-emerald-500/60 hover:text-emerald-400 sm:left-3 sm:h-10 sm:w-10"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>

                        <div
                            onClick={() => setIsZoomed((prev) => !prev)}
                            onMouseMove={handleZoomMouseMove}
                            title={isZoomed ? 'Click to reset zoom' : 'Click to zoom 2x'}
                            className={`relative flex max-h-[60vh] max-w-full items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                                }`}
                        >
                            <img
                                src={activeStudioItem.src}
                                alt={activeStudioItem.title}
                                style={{
                                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                                    transform: isZoomed ? 'scale(2)' : 'scale(1)',
                                }}
                                className="max-h-[60vh] w-auto max-w-full object-contain transition-transform duration-200 ease-out select-none"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={stepNext}
                            aria-label="Next photo"
                            className="absolute right-1 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 transition-colors hover:border-emerald-500/60 hover:text-emerald-400 sm:right-3 sm:h-10 sm:w-10"
                        >
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Bottom Thumbnail Filmstrip */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="mx-auto w-full max-w-6xl border-t border-slate-800 pt-2.5"
                    >
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {studioItems.map((thumb, idx) => {
                                const isCurrent = idx === lightboxIndex;
                                return (
                                    <button
                                        key={thumb.id}
                                        type="button"
                                        onClick={() => {
                                            setIsZoomed(false);
                                            setLightboxIndex(idx);
                                        }}
                                        aria-label={`Jump to ${thumb.title}`}
                                        className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-14 sm:w-20 ${isCurrent
                                            ? 'border-emerald-500 opacity-100'
                                            : 'border-transparent opacity-50 hover:opacity-85'
                                            }`}
                                    >
                                        <img
                                            src={thumb.src}
                                            alt={thumb.title}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Keys: &larr; / &rarr; Navigate &bull; Z Zoom &bull; Esc Close</span>
                            <span>NeeraPace Studio</span>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================================
          6. SUBTLE STATUS TOAST NOTIFICATION
      ====================================================================== */}
            {toastMessage && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-100 shadow-2xl sm:text-sm"
                >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </section>
    );
}

export default CricketGallery;