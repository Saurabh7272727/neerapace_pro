import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgramsPage } from '../features/public/PublicPages.jsx';
import { PasswordInput } from '../components/ui.jsx';
/**
 * Self-contained Inline SVG Icon Set
 * Zero external dependencies so browser preview & builds never fail on missing icon exports.
 */
const Icons = {
    Menu: ({ className = 'w-5 h-5' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
    ),
    Close: ({ className = 'w-5 h-5' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    ArrowRight: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>
    ),
    Instagram: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    ),
    Youtube: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
        </svg>
    ),
    Play: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6 4 20 12 6 20 6 4" />
        </svg>
    ),
    Check: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Clock: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    Calendar: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    Shield: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
        </svg>
    ),
    Video: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
    ),
    MapPin: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    ExternalLink: ({ className = 'w-3.5 h-3.5' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    ),
    ChevronLeft: ({ className = 'w-5 h-5' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    ),
    ChevronRight: ({ className = 'w-5 h-5' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    Lock: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    WhatsApp: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
    ),
    TrendingUp: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    ),
    Award: ({ className = 'w-4 h-4' }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
    )
};


function CricketPhoto({ src, alt, className = '', fallbackLabel = 'NeeraPace Turf Practice' }) {
    const [failed, setFailed] = useState(false);

    if (failed) {
        return (
            <div
                className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#111827] via-[#0B1120] to-[#064E3B]/40 border border-[#1F2937] p-6 text-center ${className}`}
            >
                <svg
                    className="w-14 h-14 text-[#10B981]/80 mb-3"
                    viewBox="0 0 64 64"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                >
                    {/* Cricket Stumps & Bails Illustration */}
                    <line x1="22" y1="16" x2="22" y2="50" />
                    <line x1="32" y1="16" x2="32" y2="50" />
                    <line x1="42" y1="16" x2="42" y2="50" />
                    <line x1="20" y1="15" x2="31" y2="15" stroke="#D97706" strokeWidth="2.2" />
                    <line x1="33" y1="15" x2="44" y2="15" stroke="#D97706" strokeWidth="2.2" />
                    <circle cx="50" cy="44" r="5" fill="#059669" stroke="#F8FAFC" strokeWidth="1.2" />
                </svg>
                <p className="text-sm font-semibold text-[#F8FAFC]">{fallbackLabel}</p>
                <p className="text-xs text-[#94A3B8] mt-1">NeeraPace Cricket Academy</p>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className={className}
        />
    );
}

// Curated Cricket Photography & Academy Data
const HERO_PHOTO = '../../adminPic.jpg';

const INSTAGRAM_REELS = [
    {
        id: 'reel-1',
        title: 'Wrist Position Drill',
        views: '48.2K views',
        duration: '0:42',
        category: 'Pace Mechanics',
        image:
            'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=640&q=80',
        notes:
            'Half-pitch seam alignment drill using target cones to eliminate scramble seam and produce late away movement.'
    },
    {
        id: 'reel-2',
        title: 'Cover Drive Balance',
        views: '64.5K views',
        duration: '0:55',
        category: 'Batting Technique',
        image:
            'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=640&q=80',
        notes:
            'Head-over-front-knee checkpoint drill to stop falling across on full deliveries outside off stump.'
    },
    {
        id: 'reel-3',
        title: 'Morning Turf Nets',
        views: '39.1K views',
        duration: '0:36',
        category: 'Live Session',
        image:
            'https://images.unsplash.com/photo-1593766827228-8737b4534aa6?auto=format&fit=crop&w=640&q=80',
        notes:
            '6:30 AM center-turf net session focusing on leaving deliveries on length and rotating strike cleanly.'
    }
];

const BATCH_PROGRAMS = [
    {
        id: 'Foundation Batch (U-14)',
        name: 'Foundation Batch (U-14)',
        subtitle: 'Strong technical base in batting grip, bowling action & fielding',
        popular: false,
        timings: 'Evening: 4:00 PM – 6:00 PM (Mon – Fri)',
        facilities: 'Astro & Matting Nets + Leather Ball Drills',
        features: [
            'Balanced batting stance, backlift & front-foot stride',
            'Injury-safe fast & spin bowling action alignment',
            'Weekly Saturday practice match exposure'
        ]
    },
    {
        id: 'Pro Pace & Batting Batch',
        name: 'Pro Pace & Batting Batch',
        subtitle: 'High-intensity turf training for district & club tournament players',
        popular: true,
        timings: 'Morning: 6:00 AM – 9:30 AM | Evening: 4:30 PM – 7:30 PM',
        facilities: '4 Center Turf Wickets + 140 km/h Bowling Machine',
        features: [
            'Side-on & front-on video biomechanics breakdown',
            'Speed-gun & target-cone death bowling sessions',
            'Digital attendance & progress tracking on Student Portal'
        ]
    },
    {
        id: '1-on-1 Match Mentorship',
        name: '1-on-1 Match Mentorship',
        subtitle: 'Focused individual correction & pre-selection trial preparation',
        popular: false,
        timings: 'Flexible Slots: 7:00 AM – 7:00 PM (3 Days / Week)',
        facilities: 'Dedicated Turf Net + Head Coach Video Analysis',
        features: [
            'Personalized technical diagnosis & drill roadmap',
            'Frame-by-frame video comparison reports',
            'Innings pacing & match-situation simulation'
        ]
    }
];

const PRACTICE_GALLERY = [
    {
        id: 1,
        title: 'Morning Center-Turf Batting Nets',
        category: 'Net Practice',
        caption: 'Front-foot defensive & off-drive repetition on fresh center turf wickets.',
        image:
            'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 2,
        title: 'Weekend 40-Over Practice Match',
        category: 'Match Days',
        caption: 'Full-ground match scenario practice with live scoring and fielding rings.',
        image:
            'https://images.unsplash.com/photo-1589801258579-18e091f4ca26?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 3,
        title: 'Sprint & Yo-Yo Conditioning Circuit',
        category: 'Fitness Drills',
        caption: 'Explosive 20-meter shuttle sprints and core stability work for fast bowlers.',
        image:
            'https://images.unsplash.com/photo-1593766827228-8737b4534aa6?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 4,
        title: 'Seam Release & Spot Bowling Session',
        category: 'Net Practice',
        caption: 'Target-cone channel bowling drills under coach observation.',
        image:
            'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 5,
        title: 'Inter-Academy Selection Trial Fixture',
        category: 'Match Days',
        caption: 'Competitive red-ball match evaluation ahead of district league trials.',
        image:
            'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 6,
        title: 'Agility Ladder & Close-In Catching',
        category: 'Fitness Drills',
        caption: 'Footwork quickness and low slip-catching reflexes before net sessions.',
        image:
            'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=900&q=80'
    }
];

const PACE_PROGRESSION = [
    { month: 'Jul', speed: 118, heightPct: 54 },
    { month: 'Aug', speed: 121, heightPct: 63 },
    { month: 'Sep', speed: 125, heightPct: 74 },
    { month: 'Oct', speed: 129, heightPct: 86 },
    { month: 'Nov', speed: 132, heightPct: 96 }
];

const TESTIMONIALS = [
    {
        name: 'Rohan Kulkarni',
        role: 'Fast Bowler • Pro Pace Batch',
        quote:
            'I discovered NeeraPace through their Instagram seam-position reels. Training here on real turf wickets with video feedback helped me push my pace from 118 to 132 km/h without losing line and length.'
    },
    {
        name: 'Meenakshi Sharma',
        role: 'Parent of Kabir (U-14 Foundation Batch)',
        quote:
            'The discipline and small net ratio stand out immediately. Every evening Kabir gets proper batting time, clear technical corrections, and we can check his attendance on the student portal.'
    }
];

export default function App() {
    // Navigation & Modal States
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [demoEmail, setDemoEmail] = useState('');
    const [demoPass, setDemoPass] = useState('');
    const [loginMessage, setLoginMessage] = useState('');

    const navi = useNavigate();
    // Media Preview Modal (Instagram Reels & YouTube Breakdown)
    const [selectedVideo, setSelectedVideo] = useState(null);

    // Gallery Filter & Lightbox State
    const [galleryTab, setGalleryTab] = useState('All');
    const [lightboxIdx, setLightboxIdx] = useState(null);

    // Free Trial Form State
    const [trialForm, setTrialForm] = useState({
        studentName: '',
        ageGroup: 'U-14',
        role: 'Batter',
        batch: 'Pro Pace & Batting Batch',
        whatsapp: ''
    });
    const [formError, setFormError] = useState('');
    const [confirmedTrial, setConfirmedTrial] = useState(null);

    const visibleGallery =
        galleryTab === 'All'
            ? PRACTICE_GALLERY
            : PRACTICE_GALLERY.filter((item) => item.category === galleryTab);

    // Smooth Section Scroll
    const scrollTo = (sectionId) => {
        setMobileMenuOpen(false);
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Pre-select batch from Programs card and scroll to booking form
    const handleChooseBatch = (batchName) => {
        setTrialForm((prev) => ({ ...prev, batch: batchName }));
        setConfirmedTrial(null);
        scrollTo('book-trial');
    };

    // Validate and submit Free Trial Booking Form
    const handleSubmitTrial = (e) => {
        e.preventDefault();
        const digits = trialForm.whatsapp.replace(/\D/g, '');
        if (!trialForm.studentName.trim()) {
            setFormError('Please enter the student’s full name.');
            return;
        }
        if (digits.length < 10) {
            setFormError('Please enter a valid 10-digit WhatsApp number.');
            return;
        }
        setFormError('');
        setConfirmedTrial({ ...trialForm });
    };

    // Demo Portal Login Handler
    const handleDemoPortalLogin = (e) => {
        e.preventDefault();
        if (!demoEmail.trim() || !demoPass.trim()) {
            setLoginMessage('Enter your registered email and password, or continue with Google SSO above.');
            return;
        }
        setLoginMessage('Verified! Redirecting to NeeraPace Student Dashboard (/app/student)...');
    };

    return (
        <div className="demo-content min-h-screen min-w-0 bg-[#0B1120] text-[#F8FAFC] font-sans antialiased selection:bg-[#059669] selection:text-white">

            {/* =====================================================================
          2. HERO SECTION
      ====================================================================== */}
            <section id="hero" className="border-b border-[#1F2937] bg-[#0B1120]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                        {/* Left Column */}
                        <div className="lg:col-span-7 space-y-6">
                            <section className="mx-auto max-w-4xl px-4 py-10">
                                <div className="rounded-2xl border border-slate-800 border-l-4 border-l-emerald-500 bg-slate-900/90 p-6 sm:p-8 shadow-lg">
                                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-400">
                                        Coach&apos;s Mindset
                                    </span>

                                    <blockquote className="mt-3 text-lg sm:text-2xl font-semibold leading-relaxed text-slate-100">
                                        &ldquo;Match stadium ki lights mein nahi,{" "}
                                        <span className="text-amber-400">subah 5 baje ke khali nets</span>{" "}
                                        mein jeete jaate hain. Jitna paseena aaj pitch par girega, kal utna hi
                                        shor ground mein machega.&rdquo;
                                    </blockquote>

                                    <div className="mt-5 flex items-center gap-3.5">
                                        {/* Avatar (Photo ho toh <img> laga dein, warna AS initials dikhenge) */}
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-500/60 bg-slate-800 text-sm font-extrabold text-emerald-400">
                                            AS
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-100">Abhimanyu Singh</p>
                                            <p className="text-xs text-slate-400">
                                                Founder &amp; Head Coach &bull; Neerapace Foundation And Cricket Academy by Abhimanyu Sir
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Trust Pills */}
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#111827] border border-[#1F2937] text-xs sm:text-sm font-medium text-[#F8FAFC]">
                                    <Icons.Instagram className="w-4 h-4 text-[#F59E0B]" />
                                    <span>220K+ Instagram Community</span>
                                </div>
                                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#111827] border border-[#1F2937] text-xs sm:text-sm font-medium text-[#F8FAFC]">
                                    <Icons.Youtube className="w-4 h-4 text-[#F59E0B]" />
                                    <span>12K+ YouTube Subscribers</span>
                                </div>
                            </div>

                            {/* Dual CTAs */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => scrollTo('book-trial')}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-[#059669] hover:bg-[#10B981] rounded-lg transition-colors"
                                >
                                    <span>Contact for free Trial</span>
                                    <Icons.ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Right Framed Hero Image */}
                        <div className="lg:col-span-5">
                            <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-2.5 sm:p-3">
                                <div className="relative rounded-xl overflow-hidden bg-[#0B1120]">
                                    <CricketPhoto
                                        src={HERO_PHOTO}
                                        alt="Cricketer practicing front-foot batting in turf nets"
                                        fallbackLabel="Center Turf Batting Session"
                                        className="w-full h-[330px] sm:h-[410px] object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-transparent opacity-90" />

                                    {/* Subtle Caption Badge */}
                                    <div className="absolute bottom-3.5 left-3.5 right-3.5 bg-[#111827]/95 backdrop-blur-xs border border-[#1F2937] rounded-xl p-3.5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#F59E0B]">
                                                    ICC AND ASCA
                                                </p>
                                                <p className="text-xs sm:text-sm font-semibold text-[#F8FAFC] mt-0.5">
                                                    ABHIMANYU SINGH
                                                </p>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#059669]/20 text-[#10B981] border border-[#059669]/40 shrink-0">
                                                BUILDING INDIA'S FAST BOWLERS
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================================
          3. COMMUNITY & MEDIA HUB (200K+ INSTAGRAM & 10K+ YOUTUBE)
      ====================================================================== */}
            <section id="community" className="py-16 sm:py-24 border-b border-[#1F2937] bg-[#0B1120]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl mb-12">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
                            Coaching Community &amp; Drills
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] mt-2">
                            Trusted by 220K+ Cricketers Online
                        </h2>
                        <p className="text-sm sm:text-base text-[#94A3B8] mt-2.5 leading-relaxed">
                            Every drill we share online comes straight from our daily net sessions—helping young
                            batters and fast bowlers refine their mechanics before they even step onto the ground.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Card: Instagram (@neerapace) */}
                        <div className="lg:col-span-7 bg-[#111827] border border-[#1F2937] rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#1F2937]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#0B1120] border border-[#1F2937] flex items-center justify-center text-[#F59E0B]">
                                            <Icons.Instagram className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">neera_pace_foundation_academy</h3>
                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#D97706]/15 text-[#F59E0B] border border-[#D97706]/30">
                                                    220K+ Followers
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#94A3B8] mt-0.5">
                                                Daily 60-second seam, batting stance &amp; turf net drills
                                            </p>
                                        </div>
                                    </div>

                                    <a
                                        href="https://www.instagram.com/neera_pace_foundation_academy/"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-[#CBD5E1] hover:text-white bg-[#0B1120] border border-[#1F2937] transition-colors"
                                    >
                                        <span>Follow @neera_pace_foundation_academy</span>
                                        <Icons.ExternalLink />
                                    </a>
                                </div>

                                {/* 3 Vertical Drill Preview Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                    {INSTAGRAM_REELS.map((reel) => (
                                        <button
                                            key={reel.id}
                                            type="button"
                                            onClick={() => setSelectedVideo({ platform: 'Instagram', ...reel })}
                                            className="group text-left rounded-xl overflow-hidden bg-[#0B1120] border border-[#1F2937] hover:border-[#374151] transition-colors focus:outline-none"
                                        >
                                            <div className="relative h-52 sm:h-56 overflow-hidden">
                                                <CricketPhoto
                                                    src={reel.image}
                                                    alt={reel.title}
                                                    fallbackLabel={reel.title}
                                                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/25 to-transparent" />
                                                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-[#0B1120]/85 text-[11px] font-medium text-[#CBD5E1] border border-[#1F2937]">
                                                    {reel.duration}
                                                </span>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="w-10 h-10 rounded-full bg-[#111827]/90 text-[#F8FAFC] border border-[#1F2937] flex items-center justify-center group-hover:bg-[#059669] group-hover:border-[#10B981] transition-colors">
                                                        <Icons.Play className="w-4 h-4 ml-0.5" />
                                                    </span>
                                                </div>
                                                <div className="absolute bottom-3 left-3 right-3">
                                                    <p className="text-[11px] font-medium text-[#F59E0B]">{reel.category}</p>
                                                    <p className="text-xs font-semibold text-[#F8FAFC] mt-0.5">
                                                        {reel.title}
                                                    </p>
                                                    <p className="text-[11px] text-[#94A3B8] mt-1">{reel.views}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Card: Featured YouTube Coaching Breakdown */}
                        <div className="lg:col-span-5 bg-[#111827] border border-[#1F2937] rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#1F2937]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#0B1120] border border-[#1F2937] flex items-center justify-center text-[#F59E0B]">
                                            <Icons.Youtube className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">
                                                    Neera pace foundation and cricket academy
                                                </h3>
                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#059669]/15 text-[#10B981] border border-[#059669]/30">
                                                    12K+ Subscribers
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#94A3B8] mt-0.5">
                                                Long-form biomechanics &amp; match-awareness masterclasses
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Video Preview Card */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedVideo({
                                            platform: 'YouTube',
                                            title: 'How to Add 10 KMPH Safely — Seam & Run-Up Mechanics',
                                            category: 'YouTube Masterclass • 16:40',
                                            views: '19.4K views',
                                            image:
                                                'https://images.unsplash.com/photo-1589801258579-18e091f4ca26?auto=format&fit=crop&w=900&q=80',
                                            notes:
                                                'Step-by-step breakdown of rhythmic run-up acceleration, front-arm pull, hip-shoulder separation, and upright seam release without lower-back strain.'
                                        })
                                    }
                                    className="group w-full text-left mt-6 rounded-xl overflow-hidden bg-[#0B1120] border border-[#1F2937] hover:border-[#374151] transition-colors focus:outline-none"
                                >


                                    {/* Youtube iframe =================================== */}
                                    <iframe width="100%" height="235" src="https://www.youtube.com/embed/_8Np_Q23lyM" title="Podcast with Abhimanyu sir (Neera pace ) #cricket #fastbowling #trannding #youtube " frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

                                    <div className="p-4">
                                        <p className="text-xs font-semibold text-[#10B981]">
                                            Featured Coaching Breakdown
                                        </p>
                                        <h4 className="text-sm sm:text-base font-bold text-[#F8FAFC] mt-1">
                                            How to Add 10 KMPH Safely — Seam &amp; Run-Up Mechanics
                                        </h4>
                                        <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">

                                            Podcast with Abhimanyu sir (Neera pace )
                                        </p>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-5 pt-4 border-t border-[#1F2937] flex items-center justify-between">
                                <span className="text-xs text-[#94A3B8]">Weekly technical breakdowns</span>
                                <a
                                    href="https://youtube.com/@neerapacefoundation815?si=ydygLYs-A7H717H0"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-[#CBD5E1] hover:text-white bg-[#0B1120] border border-[#1F2937] transition-colors"
                                >
                                    <span>Join on YouTube</span>
                                    <Icons.ExternalLink />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================================
          4. TRAINING PROGRAMS & COACHING BATCHES
      ====================================================================== */}
            <section id="programs" className="py-16 sm:py-24 border-b border-[#1F2937] bg-[#0B1120]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl mb-12">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
                            Structured Coaching
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] mt-2">
                            Training Programs &amp; Coaching Batches
                        </h2>
                        <p className="text-sm sm:text-base text-[#94A3B8] mt-2.5 leading-relaxed">
                            Every player begins with a complimentary net evaluation so coaches can place them in
                            the batch best suited to their age and current skill level.
                        </p>
                    </div>
                </div>

                <ProgramsPage showHeading={false} />
            </section>

            {/* =====================================================================
          5. INSIDE THE NETS (PRACTICE GALLERY)
      ====================================================================== */}
            <section
                id="practice-gallery"
                className="py-16 sm:py-24 border-b border-[#1F2937] bg-[#0B1120]"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
                                Daily Ground Work
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] mt-2">
                                Inside The Nets
                            </h2>
                            <p className="text-sm sm:text-base text-[#94A3B8] mt-2 max-w-xl">
                                Real practice sessions, match-day fixtures, and conditioning drills from our turf
                                ground. Click any photo to enlarge.
                            </p>
                        </div>

                        {/* Interactive Category Filter Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Net Practice', 'Match Days', 'Fitness Drills'].map((tab) => {
                                const isActive = galleryTab === tab;
                                return (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setGalleryTab(tab)}
                                        className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${isActive
                                            ? 'bg-[#059669] text-white border-[#059669]'
                                            : 'bg-[#111827] text-[#CBD5E1] border-[#1F2937] hover:text-white'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3-Column Practice Photo Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleGallery.map((photo, index) => (
                            <button
                                key={photo.id}
                                type="button"
                                onClick={() => setLightboxIdx(index)}
                                className="group text-left rounded-2xl overflow-hidden bg-[#111827] border border-[#1F2937] hover:border-[#374151] transition-colors focus:outline-none"
                            >
                                <div className="relative h-60 overflow-hidden bg-[#0B1120]">
                                    <CricketPhoto
                                        src={photo.image}
                                        alt={photo.title}
                                        fallbackLabel={photo.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/90 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
                                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-medium bg-[#111827]/90 text-[#CBD5E1] border border-[#1F2937]">
                                        {photo.category}
                                    </span>
                                    <div className="absolute bottom-3 left-3.5 right-3.5 opacity-95 group-hover:translate-y-0 transition-transform">
                                        <p className="text-xs text-[#CBD5E1] line-clamp-2">{photo.caption}</p>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center justify-between gap-2">
                                    <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC] group-hover:text-[#10B981] transition-colors">
                                        {photo.title}
                                    </h3>
                                    <span className="text-xs text-[#94A3B8] shrink-0">View</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* =====================================================================
          6. STUDENT PERFORMANCE PORTAL & MENTORSHIP
      ====================================================================== */}
            <section id="student-portal" className="py-16 sm:py-24 border-b border-[#1F2937] bg-[#0B1120]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                        {/* Left Side: NeeraPace Student Dashboard Preview */}
                        <div className="lg:col-span-7">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
                                Digital Player Tracking
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] mt-2">
                                Measurable Growth on the Student Portal
                            </h2>
                            <p className="text-sm sm:text-base text-[#94A3B8] mt-2.5 leading-relaxed">
                                Enrolled players and parents log into{' '}
                                <span className="text-[#CBD5E1] font-medium">neerapace.in</span> to monitor net
                                attendance streaks, bowling speed progression, and coach video feedback notes.
                            </p>

                            {/* Dashboard Preview Card */}
                            <div className="mt-7 bg-[#111827] border border-[#1F2937] rounded-2xl p-5 sm:p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1F2937]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#059669]/20 border border-[#059669]/50 flex items-center justify-center text-sm font-bold text-[#10B981]">
                                            RK
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#F8FAFC]">
                                                Rohan Kulkarni &bull; Pro Pace Batch
                                            </p>
                                            <p className="text-xs text-[#94A3B8]">
                                                Right-Arm Fast-Medium &bull; Member ID #NP-108
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#0B1120] text-[#F59E0B] border border-[#1F2937]">
                                        Live Portal View
                                    </span>
                                </div>

                                {/* Pace Progression Bars + Attendance Streak */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 mt-5">
                                    {/* Bowling Pace Progression (118 to 132 km/h) */}
                                    <div className="sm:col-span-7 bg-[#0B1120] border border-[#1F2937] rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-[#CBD5E1]">
                                                    Bowling Pace Progression
                                                </p>
                                                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                                                    5-Month Speed Radar Log
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#10B981]">
                                                <Icons.TrendingUp className="w-3.5 h-3.5" />
                                                +14 km/h
                                            </span>
                                        </div>

                                        <div className="mt-5 grid grid-cols-5 gap-2.5 items-end h-32 pt-4">
                                            {PACE_PROGRESSION.map((item, idx) => {
                                                const isLatest = idx === PACE_PROGRESSION.length - 1;
                                                return (
                                                    <div key={item.month} className="flex flex-col items-center h-full justify-end">
                                                        <span
                                                            className={`text-[11px] font-semibold mb-1.5 ${isLatest ? 'text-[#10B981]' : 'text-[#94A3B8]'
                                                                }`}
                                                        >
                                                            {item.speed}
                                                        </span>
                                                        <div
                                                            style={{ height: `${item.heightPct}%` }}
                                                            className={`w-full max-w-[34px] rounded-t-md transition-all ${isLatest
                                                                ? 'bg-[#059669] border border-[#10B981]'
                                                                : 'bg-[#1F2937]'
                                                                }`}
                                                        />
                                                        <span className="text-[11px] text-[#94A3B8] mt-1.5">{item.month}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Attendance Streak & Session Consistency */}
                                    <div className="sm:col-span-5 flex flex-col justify-between gap-4">
                                        <div className="bg-[#0B1120] border border-[#1F2937] rounded-xl p-4">
                                            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                                                <span>Attendance Streak</span>
                                                <Icons.Calendar className="w-4 h-4 text-[#F59E0B]" />
                                            </div>
                                            <p className="text-2xl font-bold text-[#F8FAFC] mt-2">18 Sessions</p>
                                            <p className="text-xs text-[#10B981] mt-1">94% Monthly Attendance</p>
                                        </div>

                                        <div className="bg-[#0B1120] border border-[#1F2937] rounded-xl p-4">
                                            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                                                <span>Peak Delivery</span>
                                                <Icons.Award className="w-4 h-4 text-[#10B981]" />
                                            </div>
                                            <p className="text-2xl font-bold text-[#F8FAFC] mt-2">145 km/h</p>
                                            <p className="text-xs text-[#94A3B8] mt-1">Up from 118 km/h in July</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Latest Coach Video Note */}
                                <div className="mt-5 bg-[#0B1120] border border-[#1F2937] rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B]">
                                        <Icons.Video className="w-4 h-4" />
                                        <span>Latest Coach Video Note &bull; Turf Net #1</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-[#CBD5E1] mt-2 leading-relaxed">
                                        &ldquo;Non-bowling arm is staying much taller through the crease now, adding
                                        natural bounce from back-of-a-length. Focus next week on holding the same
                                        wrist seam angle with the older ball.&rdquo;
                                    </p>
                                    <p className="text-[11px] text-[#94A3B8] mt-2">
                                        Logged by Head Coach &bull; Video Clip #V-412 Attached
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Head Coach Profile Card + 2 Grounded Testimonials */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Head Coach Profile Card */}
                            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-[#0B1120] border border-[#1F2937] flex items-center justify-center text-lg font-bold text-[#F59E0B] shrink-0">
                                        NP
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#10B981]">
                                            Head Coach &amp; Founder
                                        </span>
                                        <h3 className="text-lg font-bold text-[#F8FAFC] mt-0.5">
                                            NeeraPace Coaching Desk
                                        </h3>
                                        <p className="text-xs text-[#94A3B8] mt-0.5">
                                            Pace &amp; Batting Biomechanics &bull; 210K+ Online Community
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-[#CBD5E1] mt-4 leading-relaxed">
                                    Our coaching philosophy avoids quick-fix gimmicks. We build repeatable batting
                                    balance, safe bowling actions, and calm match temperament with a strict 1:8
                                    coach-to-player net ratio.
                                </p>
                            </div>

                            {/* 2 Grounded Testimonials */}
                            <div className="space-y-4">
                                {TESTIMONIALS.map((item) => (
                                    <div
                                        key={item.name}
                                        className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 sm:p-6"
                                    >
                                        <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                                            &ldquo;{item.quote}&rdquo;
                                        </p>
                                        <div className="mt-4 pt-3.5 border-t border-[#1F2937] flex items-center justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-bold text-[#F8FAFC]">{item.name}</p>
                                                <p className="text-xs text-[#94A3B8] mt-0.5">{item.role}</p>
                                            </div>
                                            <span className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#059669]/15 text-[#10B981] border border-[#059669]/30 shrink-0">
                                                Verified
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================================
          7. BOOK FREE TRIAL FORM & GROUND INFO
      ====================================================================== */}
            <section id="book-trial" className="py-16 sm:py-24 bg-[#0B1120]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                        {/* Left: Interactive Lead Form */}
                        <div className="order-2 min-w-0 text-white space-y-5 lg:order-1 lg:col-span-5">
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
                            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                                {/* Instagram */}
                                <a
                                    href="https://www.instagram.com/neera_pace_foundation_academy/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 rounded-2xl border border-line px-3.5 py-2.5 text-xs font-semibold text-ink transition-all hover:border-pitch hover:bg-pitch/5"
                                >
                                    <svg className="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                    </svg>
                                    <div className="min-w-0">
                                        <div className="truncate text-white">Instagram</div>
                                        <div className="text-[11px] font-normal text-white/60">220K+ Followers</div>
                                    </div>
                                </a>

                                {/* YouTube */}
                                <a
                                    href="https://youtube.com/@neerapacefoundation815?si=ydygLYs-A7H717H0"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 rounded-2xl border border-line px-3.5 py-2.5 text-xs font-semibold text-ink transition-all hover:border-pitch hover:bg-pitch/5"
                                >
                                    <svg className="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="min-w-0">
                                        <div className="truncate text-white">YouTube</div>
                                        <div className="text-[11px] font-normal text-white/60">12K+ Subscribers</div>
                                    </div>
                                </a>

                                {/* WhatsApp */}
                                <a
                                    href="https://wa.me/7011693617"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 rounded-2xl border border-line px-3.5 py-2.5 text-xs font-semibold text-ink transition-all hover:border-pitch hover:bg-pitch/5"
                                >
                                    <svg className="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <div className="min-w-0">
                                        <div className="truncate text-white">WhatsApp</div>
                                        <div className="text-[11px] font-normal text-white/60">Quick Chat</div>
                                    </div>
                                </a>

                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => navi('/contact')}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-[#059669] hover:bg-[#10B981] rounded-lg transition-colors"
                                >
                                    <span>Click for Enquiry </span>
                                    <Icons.ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>


                        {/* Right: Ground Timings & Facilities Card */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 sm:p-8">
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
                                    Ground Timings &amp; Facilities
                                </p>
                                <h3 className="text-xl font-bold text-[#F8FAFC] mt-2">
                                    NeeraPace Cricket Ground
                                </h3>
                                <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">
                                    Parents and players are welcome to visit during active net hours to observe a
                                    live session before booking.
                                </p>

                                <div className="mt-6 pt-5 border-t border-[#1F2937] space-y-4 text-sm">
                                    <div className="flex items-start gap-3">
                                        <Icons.Clock className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-[#F8FAFC]">Morning Net Session</p>
                                            <p className="text-[#94A3B8]">6:00 AM – 9:30 AM (Tuesday – Sunday)</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Icons.Clock className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-[#F8FAFC]">Evening Net Session</p>
                                            <p className="text-[#94A3B8]">4:00 PM – 7:30 PM (Monday – Saturday)</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Icons.MapPin className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-[#F8FAFC]">Turf &amp; Astro Wickets</p>
                                            <p className="text-[#94A3B8]">
                                                4 Center Turf Wickets &bull; 2 All-Weather Astro Nets &bull; Bowling
                                                Machine &bull; Full Match Outfield
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 rounded-xl bg-[#0B1120] border border-[#1F2937] p-4">
                                    <p className="text-xs font-semibold text-[#CBD5E1]">Trial Day Checklist</p>
                                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                                        Carry your personal batting/keeping kit if available, sports shoes, and water
                                        bottle. Match-grade leather balls and turf nets are provided by the academy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================================
          MODAL 1: STUDENT LOGIN MODAL (GOOGLE SSO + DEMO PORTAL ACCESS)
      ====================================================================== */}
            {loginModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="np-login-title"
                >
                    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl max-w-md w-full p-6 sm:p-7">
                        <div className="flex items-center justify-between pb-4 border-b border-[#1F2937]">
                            <div className="flex items-center gap-2">
                                <Icons.Lock className="w-4 h-4 text-[#10B981]" />
                                <h3 id="np-login-title" className="text-lg font-bold text-[#F8FAFC]">
                                    NeeraPace Student Portal
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setLoginModalOpen(false)}
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#0B1120]"
                                aria-label="Close login modal"
                            >
                                <Icons.Close />
                            </button>
                        </div>

                        <p className="text-xs sm:text-sm text-[#94A3B8] mt-3 leading-relaxed">
                            Sign in with your academy Google account to check net attendance, pace logs, and
                            coach video reviews.
                        </p>

                        {/* Primary Google SSO Redirect (/api/auth/google/start) */}
                        <a
                            href="/api/auth/google/start"
                            className="mt-5 w-full inline-flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-[#F8FAFC] hover:bg-slate-200 text-sm font-semibold text-[#0B1120] transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    fill="#4285F4"
                                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                                />
                            </svg>
                            <span>Continue with Google SSO</span>
                        </a>

                        <div className="my-4 flex items-center gap-3">
                            <div className="h-px bg-[#1F2937] flex-1" />
                            <span className="text-[11px] text-[#94A3B8] uppercase tracking-wider">
                                or demo preview login
                            </span>
                            <div className="h-px bg-[#1F2937] flex-1" />
                        </div>

                        <form onSubmit={handleDemoPortalLogin} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                                    Student Email
                                </label>
                                <input
                                    type="email"
                                    value={demoEmail}
                                    onChange={(e) => setDemoEmail(e.target.value)}
                                    placeholder="rohan@neerapace.in"
                                    className="w-full px-3.5 py-2 rounded-lg bg-[#0B1120] border border-[#1F2937] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#10B981]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Password</label>
                                <PasswordInput
                                    value={demoPass}
                                    onChange={(e) => setDemoPass(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3.5 py-2 rounded-lg bg-[#0B1120] border border-[#1F2937] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#10B981]"
                                />
                            </div>

                            {loginMessage && (
                                <p className="text-xs text-[#10B981] bg-[#059669]/15 border border-[#059669]/40 rounded-lg p-2.5">
                                    {loginMessage}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#059669] hover:bg-[#10B981] transition-colors"
                            >
                                Sign In to Portal
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* =====================================================================
          MODAL 2: PRACTICE GALLERY LIGHTBOX MODAL
      ====================================================================== */}
            {lightboxIdx !== null && visibleGallery[lightboxIdx] && (
                <div
                    className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="max-w-4xl w-full bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1F2937]">
                            <div>
                                <span className="text-xs font-semibold text-[#F59E0B]">
                                    {visibleGallery[lightboxIdx].category}
                                </span>
                                <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC]">
                                    {visibleGallery[lightboxIdx].title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setLightboxIdx(null)}
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#0B1120]"
                                aria-label="Close lightbox"
                            >
                                <Icons.Close />
                            </button>
                        </div>

                        <div className="relative bg-[#0B1120]">
                            <CricketPhoto
                                src={visibleGallery[lightboxIdx].image}
                                alt={visibleGallery[lightboxIdx].title}
                                fallbackLabel={visibleGallery[lightboxIdx].title}
                                className="w-full max-h-[68vh] object-contain mx-auto"
                            />

                            {visibleGallery.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setLightboxIdx(
                                                (lightboxIdx - 1 + visibleGallery.length) % visibleGallery.length
                                            )
                                        }
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#111827]/90 text-[#F8FAFC] hover:bg-[#1F2937] border border-[#1F2937]"
                                        aria-label="Previous image"
                                    >
                                        <Icons.ChevronLeft />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLightboxIdx((lightboxIdx + 1) % visibleGallery.length)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#111827]/90 text-[#F8FAFC] hover:bg-[#1F2937] border border-[#1F2937]"
                                        aria-label="Next image"
                                    >
                                        <Icons.ChevronRight />
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="px-5 py-3.5 bg-[#111827] border-t border-[#1F2937] flex items-center justify-between gap-4">
                            <p className="text-xs sm:text-sm text-[#CBD5E1]">
                                {visibleGallery[lightboxIdx].caption}
                            </p>
                            <span className="text-xs text-[#94A3B8] shrink-0">
                                {lightboxIdx + 1} / {visibleGallery.length}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================================
          MODAL 3: DRILL & VIDEO PREVIEW MODAL
      ====================================================================== */}
            {selectedVideo && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="max-w-lg w-full bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden">
                        <div className="relative h-56 bg-[#0B1120]">
                            <CricketPhoto
                                src={selectedVideo.image}
                                alt={selectedVideo.title}
                                fallbackLabel={selectedVideo.title}
                                className="w-full h-full object-cover opacity-85"
                            />
                            <button
                                type="button"
                                onClick={() => setSelectedVideo(null)}
                                className="absolute top-3 right-3 p-2 rounded-full bg-[#111827]/90 text-white hover:bg-[#1F2937] border border-[#1F2937]"
                                aria-label="Close video preview"
                            >
                                <Icons.Close className="w-4 h-4" />
                            </button>
                            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-[#111827]/90 text-xs font-medium text-[#F59E0B] border border-[#1F2937]">
                                {selectedVideo.category}
                            </span>
                        </div>

                        <div className="p-6">
                            <h3 className="text-lg font-bold text-[#F8FAFC]">{selectedVideo.title}</h3>
                            <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">{selectedVideo.notes}</p>
                            <div className="mt-5 pt-4 border-t border-[#1F2937] flex items-center justify-between gap-3">
                                <a
                                    href={
                                        selectedVideo.platform === 'YouTube'
                                            ? 'https://youtube.com'
                                            : 'https://www.instagram.com/neera_pace_foundation_academy/'
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#059669] hover:bg-[#10B981] transition-colors"
                                >
                                    <span>Watch on {selectedVideo.platform}</span>
                                    <Icons.ExternalLink />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setSelectedVideo(null)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-[#CBD5E1] hover:text-white bg-[#0B1120] border border-[#1F2937]"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
