import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode, type CSSProperties } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useTransform,
    useSpring,
    useReducedMotion,
    useMotionValueEvent,
    type MotionValue,
} from "framer-motion";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { SEOHead } from "@/components/SEOHead";
import { MerchShowcase3D } from "@/components/marketing/MerchShowcase3D";
import "./marketing-ponuda.css";

/* ------------------------------------------------------------------ */
/*  Assets (downloaded from the reference project into /public)        */
/* ------------------------------------------------------------------ */
const A = (name: string) => `/marketing/${name}`;
const IMG = {
    hero: A("hero.jpg"),
    about: A("about.jpg"),
    action1: A("action1.jpg"),
    action2: A("action2.jpg"),
    action3: A("action3.jpg"),
    action4: A("action4.jpg"),
    sponsor: A("sponsor.jpg"),
    event1: A("event1.jpg"),
    partners: A("partners.jpg"),
    logo: A("dispet-logo-official.png"),
    mascotWave: A("dispet-mascot-wave.gif"),
    mascotDance: A("dispet-mascot-dance.gif"),
};

const trackEvent = (name: string, params?: Record<string, unknown>) => {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", name, params || {});
};

/* ------------------------------------------------------------------ */
/*  Section gallery infrastructure (variations of the merch gallery)   */
/* ------------------------------------------------------------------ */

/** All section photos for the lightbox — grouped by section */
const SECTION_PHOTOS = {
    onama: [IMG.about, IMG.action2, IMG.action3, IMG.action4, IMG.hero, IMG.event1],
    teren: [IMG.action1, IMG.action2, IMG.action3, IMG.action4, IMG.about, IMG.event1, IMG.hero, IMG.sponsor],
    sponsor: [IMG.sponsor, IMG.action1, IMG.event1, IMG.partners, IMG.about, IMG.action4],
    partneri: [IMG.partners, IMG.event1, IMG.action1, IMG.action2, IMG.action3, IMG.sponsor, IMG.about, IMG.hero],
};
const ALL_GALLERY_PHOTOS = [...new Set(Object.values(SECTION_PHOTOS).flat())];

/** Shared lightbox component */
const GalleryLightbox = ({
    photos,
    selected,
    setSelected,
}: {
    photos: string[];
    selected: number | null;
    setSelected: (v: number | null) => void;
}) => {
    const next = useCallback(() => setSelected(selected === null ? null : (selected + 1) % photos.length), [selected, photos.length, setSelected]);
    const prev = useCallback(() => setSelected(selected === null ? null : (selected - 1 + photos.length) % photos.length), [selected, photos.length, setSelected]);

    useEffect(() => {
        if (selected === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "Escape") setSelected(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selected, next, prev, setSelected]);

    if (selected === null) return null;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-2 backdrop-blur-sm md:p-8"
            onClick={() => setSelected(null)}
        >
            <button type="button" aria-label="Zatvori" className="fixed right-4 top-4 z-[120] flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50" onClick={(e) => { e.stopPropagation(); setSelected(null); }}>
                <X className="h-6 w-6" />
            </button>
            <button type="button" aria-label="Prethodna" className="fixed left-2 top-1/2 z-[120] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 md:left-8" onClick={(e) => { e.stopPropagation(); prev(); }}>
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button type="button" aria-label="Sljedeća" className="fixed right-2 top-1/2 z-[120] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 md:right-8" onClick={(e) => { e.stopPropagation(); next(); }}>
                <ChevronRight className="h-6 w-6" />
            </button>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex h-full w-full flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <img src={photos[selected]} alt="Dišpet fotografija" className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl" />
                <div className="mt-4 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md">
                    {selected + 1} / {photos.length}
                </div>
            </motion.div>
        </motion.div>
    );
};

const GALLERY_WIDTHS = [
    "w-[220px] md:w-[400px]",
    "w-[180px] md:w-[310px]",
    "w-[250px] md:w-[500px]",
    "w-[200px] md:w-[360px]",
];

/** One marquee row, exactly like the merch section's GalleryRow but flat (without 3D) */
const SectionGalleryRow = ({
    photos,
    progress,
    direction = "left",
    offset = 0,
    accentColor = "var(--mk-pink)",
    shadowColor = "rgba(247,65,128,0.5)",
    onPhotoClick,
}: {
    photos: string[];
    progress: MotionValue<number>;
    direction?: "left" | "right";
    offset?: number;
    accentColor?: string;
    shadowColor?: string;
    onPhotoClick: (idx: number) => void;
}) => {
    const reduce = useReducedMotion();
    const doubled = [...photos, ...photos];
    // Gentle travel across the whole page scroll - matching merch slow drift
    const x = useTransform(
        progress,
        [0, 1],
        direction === "left" ? [`${-4 - offset}%`, `${-20 - offset}%`] : [`${-20 - offset}%`, `${-4 - offset}%`],
    );
    return (
        <div className="relative -mx-5 overflow-hidden py-4 sm:py-6">
            <div className="flex overflow-hidden">
                <motion.div className="flex flex-nowrap gap-3 md:gap-5" style={reduce ? undefined : { x }}>
                    {doubled.map((src, i) => (
                        <button
                            key={`${src}-${i}`}
                            type="button"
                            onClick={() => onPhotoClick(photos.indexOf(src))}
                            className={`group relative h-[140px] ${GALLERY_WIDTHS[i % GALLERY_WIDTHS.length]} flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border-4 border-transparent transition-all duration-500 hover:z-10 hover:scale-[1.04] hover:border-[var(--hover-border)] hover:shadow-[var(--hover-shadow)] focus-visible:outline-none focus-visible:ring-2 md:h-[230px]`}
                            style={{
                                ['--hover-border' as string]: accentColor,
                                ['--hover-shadow' as string]: `0 25px 60px -20px ${shadowColor}`,
                            } as CSSProperties}
                        >
                            <img
                                src={src}
                                alt="Dišpet"
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent transition-colors group-hover:from-black/10" />
                            <span className="mk-display absolute bottom-2.5 right-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] text-white/85 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
                                {(photos.indexOf(src) + 1).toString().padStart(2, "0")} / {photos.length}
                            </span>
                        </button>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  FAQ — answers verbatim from page copy (no invented facts)          */
/* ------------------------------------------------------------------ */
const FAQ_ITEMS = [
    {
        q: "Što je Dišpet?",
        a: "Dišpet nije događaj — Dišpet je pokret i projekt koji spaja zabavu, sport i edukaciju za djecu predškolske dobi i nižih razreda osnovne škole.",
    },
    {
        q: "Kako se Dišpet financira?",
        a: "Financira se isključivo od sponzora — za svu djecu uvijek besplatno.",
    },
    {
        q: "Gdje se Dišpet održava?",
        a: "Split je baza pokreta, a događanja se održavaju diljem Dalmacije. Cilj 2026. je širenje na 3 grada.",
    },
    {
        q: "Koliko košta Dišpet merch?",
        a: "Majica 30€, duksica 50€, kapa 20€, termosica 20€ — 100% hrvatski proizvod, a sva zarada ide u razvoj projekta.",
    },
    {
        q: "Kako postati sponzor?",
        a: "Ispunite formu — javljamo se u roku 24h s prijedlogom paketa po mjeri. Bez obaveze.",
    },
];

/* ------------------------------------------------------------------ */
/*  JSON-LD — only facts that exist on this page                       */
/* ------------------------------------------------------------------ */
const SCHEMA_GRAPH = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": "https://dispet.fun/#org",
            name: "Dišpet",
            url: "https://dispet.fun",
            logo: "https://dispet.fun/marketing/dispet-logo-official.png",
            description:
                "Pokret i projekt koji spaja zabavu, sport i edukaciju za djecu predškolske dobi i nižih razreda osnovne škole. Besplatno za svu djecu — financira se isključivo od sponzora.",
            areaServed: "Dalmacija, Hrvatska",
            location: {
                "@type": "Place",
                address: { "@type": "PostalAddress", addressLocality: "Split", addressCountry: "HR" },
            },
            telephone: "+385955144085",
            sameAs: ["https://instagram.com/dispet.fun"],
        },
        {
            "@type": "WebPage",
            "@id": "https://dispet.fun/marketing-ponuda",
            name: "Dišpet — Marketing Ponuda 2026",
            inLanguage: "hr",
            isPartOf: { "@id": "https://dispet.fun/#org" },
        },
        {
            "@type": "OfferCatalog",
            name: "Sponzorski paketi 2026",
            itemListElement: [
                { "@type": "Offer", name: "Sponzorske površine", description: "150m+ ograde, brendirani paneli i logo na svim materijalima na terenu." },
                { "@type": "Offer", name: "Digitalna vidljivost", description: "dispet.fun, društvene mreže, foto i video sadržaj te newsletter." },
                { "@type": "Offer", name: "Aktivacija na terenu", description: "Vlastiti štand, dijeljenje proizvoda i sponzorstvo igara." },
                { "@type": "Offer", name: "Reklamni materijali", description: "Majice i oprema s vašim logom, pokloni za djecu, web integracija." },
                { "@type": "Offer", name: "Medijske kampanje", description: "Zajednički PR nastup i koordinirane kampanje na svim kanalima." },
            ],
        },
        { "@type": "Product", name: "Dišpet majica", offers: { "@type": "Offer", price: "30", priceCurrency: "EUR", url: "https://dispet.fun/shop?product=tshirt" } },
        { "@type": "Product", name: "Dišpet duksica", offers: { "@type": "Offer", price: "50", priceCurrency: "EUR", url: "https://dispet.fun/shop?product=hoodie" } },
        { "@type": "Product", name: "Dišpet kapa", offers: { "@type": "Offer", price: "20", priceCurrency: "EUR", url: "https://dispet.fun/shop?product=cap" } },
        { "@type": "Product", name: "Dišpet Termosica", offers: { "@type": "Offer", price: "20", priceCurrency: "EUR", url: "https://dispet.fun/shop?product=bottle" } },
        {
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
        },
    ],
};

/* ------------------------------------------------------------------ */
/*  Scroll-driven animation primitives                                 */
/*  Everything is SCRUBBED by scroll position (reversible),            */
/*  not triggered once.                                                */
/* ------------------------------------------------------------------ */

interface DrivenProps {
    children: ReactNode;
    className?: string;
    /** starting offset of the element before it scrubs into place */
    fromY?: number;
    fromX?: number;
    fromRotate?: number;
    fromScale?: number;
    /** shifts the scrub window later (use to stagger items in the same row) */
    delay?: number;
    style?: CSSProperties;
}

/** Reveal whose progress is bound to the element's own viewport position. */
const Driven = ({
    children,
    className,
    fromY = 44,
    fromX = 0,
    fromRotate = 0,
    fromScale = 1,
    delay = 0,
    style,
}: DrivenProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const start = Math.max(0.5, 0.96 - delay);
    const end = Math.max(0.35, 0.58 - delay);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: [`start ${start}`, `start ${end}`],
    });
    const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
    const y = useTransform(scrollYProgress, [0, 1], [fromY, 0]);
    const x = useTransform(scrollYProgress, [0, 1], [fromX, 0]);
    const rotate = useTransform(scrollYProgress, [0, 1], [fromRotate, 0]);
    const scale = useTransform(scrollYProgress, [0, 1], [fromScale, 1]);

    if (reduce) {
        return (
            <div ref={ref} className={className} style={style}>
                {children}
            </div>
        );
    }
    return (
        <motion.div ref={ref} className={className} style={{ ...style, opacity, y, x, rotate, scale }}>
            {children}
        </motion.div>
    );
};

/** Continuous parallax drift while the element crosses the viewport. */
const Parallax = ({
    children,
    className,
    dist = 40,
    style,
}: {
    children: ReactNode;
    className?: string;
    dist?: number;
    style?: CSSProperties;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], [dist, -dist]);
    if (reduce) {
        return (
            <div ref={ref} className={className} style={style}>
                {children}
            </div>
        );
    }
    return (
        <motion.div ref={ref} className={className} style={{ ...style, y }}>
            {children}
        </motion.div>
    );
};

/** Counter scrubbed by scroll — counts up AND back down as you scroll.
 *  Initial render shows the FINAL value so crawlers and prerendered HTML
 *  always carry the real number. */
const ScrollCount = ({ value, className }: { value: string; className?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const reduce = useReducedMotion();
    const match = value.match(/^([\d.,]+)(.*)$/);
    const rawNum = match ? match[1] : "";
    const suffix = match ? match[2] : value;
    const target = match ? parseFloat(rawNum.replace(/\./g, "").replace(",", ".")) : 0;
    const useThousands = rawNum.includes(".");

    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "start 0.45"] });
    const eased = useTransform(scrollYProgress, (p) => 1 - Math.pow(1 - p, 3));
    const num = useTransform(eased, (p) => Math.round(target * p));
    const [text, setText] = useState(value);
    useMotionValueEvent(num, "change", (v) => {
        if (reduce || !match) return;
        setText((useThousands ? v.toLocaleString("hr-HR") : String(v)) + suffix);
    });

    return (
        <span ref={ref} className={className}>
            {reduce || !match ? value : text}
        </span>
    );
};

/** Underline that draws itself in, driven by scroll. */
const DrivenRule = ({ className = "" }: { className?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "start 0.55"] });
    const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
    return (
        <div ref={ref} className={`h-1 w-full overflow-hidden ${className}`}>
            <motion.div className="mk-rainbow h-full w-full origin-left" style={reduce ? undefined : { scaleX }} />
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Small shared UI                                                    */
/* ------------------------------------------------------------------ */

const TAG_COLORS = {
    teal: "bg-mk-teal text-on-bright",
    pink: "bg-mk-pink text-white",
    yellow: "bg-mk-yellow text-on-bright",
    green: "bg-mk-green text-on-bright",
} as const;

const SectionTag = ({ label, color = "teal" }: { label: string; color?: keyof typeof TAG_COLORS }) => (
    <span
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] ${TAG_COLORS[color]}`}
    >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
        {label}
    </span>
);

/** Inline conversion row — reuses the sticky-bar strings. */
const CtaRow = ({ location }: { location: string }) => (
    <Driven fromY={28} className="mt-12 flex flex-col items-center gap-3 text-center">
        <a
            href="#kontakt"
            onClick={() => trackEvent("cta_request_offer_click", { location })}
            className="inline-flex min-h-11 items-center rounded-full bg-mk-pink px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:opacity-90"
        >
            Zatraži ponudu
        </a>
        <p className="text-sm text-white/75">Kreiramo paket po mjeri — odgovor u 24h.</p>
    </Driven>
);

/* ------------------------------------------------------------------ */
/*  Nav + sticky CTA                                                   */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
    { href: "#o-nama", label: "O nama" },
    { href: "#teren", label: "Na terenu" },
    { href: "#zasto", label: "Zašto" },
    { href: "#paketi", label: "Paketi" },
    { href: "#digital", label: "Digital" },
    { href: "#partneri", label: "Partneri" },
    { href: "#merch", label: "Merch" },
];

const Nav = ({ pageProgress }: { pageProgress: MotionValue<number> }) => {
    const [open, setOpen] = useState(false);
    const reduce = useReducedMotion();
    const scaleX = useSpring(pageProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
    return (
        <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-lg" style={{ backgroundColor: "rgba(7,17,35,0.85)" }}>
            {/* Scroll progress bar — the rainbow fills as you read */}
            <div className="h-1 w-full bg-white/5">
                <motion.div className="mk-rainbow h-full w-full origin-left" style={reduce ? undefined : { scaleX }} />
            </div>
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
                <a href="#top" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
                    <img src={IMG.logo} alt="Dišpet logo" width={48} height={48} className="h-11 w-11 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] sm:h-12 sm:w-12" />
                    <span className="mk-display text-xl tracking-tight text-white">
                        DI<span className="mk-pink">Š</span>PET
                    </span>
                </a>
                <nav aria-label="Glavna navigacija" className="hidden gap-6 text-sm font-semibold text-white/80 lg:flex">
                    {NAV_LINKS.map((l) => (
                        <a key={l.href} href={l.href} className="rounded-md px-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mk-pink)]">
                            {l.label}
                        </a>
                    ))}
                </nav>
                <div className="flex items-center gap-2">
                    <a
                        href="#kontakt"
                        onClick={() => trackEvent("cta_request_offer_click", { location: "nav" })}
                        className="hidden min-h-11 items-center rounded-full bg-mk-pink px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 sm:inline-flex"
                    >
                        Kontakt
                    </a>
                    <button
                        type="button"
                        aria-label={open ? "Zatvori izbornik" : "Otvori izbornik"}
                        aria-expanded={open}
                        onClick={() => setOpen((v) => !v)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 text-white lg:hidden"
                    >
                        <span className="relative block h-3 w-5" aria-hidden="true">
                            <span className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition ${open ? "translate-y-1.5 rotate-45" : ""}`} />
                            <span className={`absolute bottom-0 left-0 h-0.5 w-5 bg-current transition ${open ? "-translate-y-1 -rotate-45" : ""}`} />
                        </span>
                    </button>
                </div>
            </div>
            {open && (
                <div className="border-t border-white/10 lg:hidden" style={{ backgroundColor: "rgba(7,17,35,0.95)" }}>
                    <nav className="mx-auto flex max-w-7xl flex-col px-5 py-3">
                        {NAV_LINKS.map((l) => (
                            <a
                                key={l.href}
                                href={l.href}
                                onClick={() => setOpen(false)}
                                className="border-b border-white/5 py-3 text-sm font-medium text-white/85"
                            >
                                {l.label}
                            </a>
                        ))}
                        <a href="#kontakt" onClick={() => setOpen(false)} className="mt-3 inline-flex justify-center rounded-full bg-mk-pink px-4 py-2.5 text-sm font-bold text-white">
                            Kontakt
                        </a>
                    </nav>
                </div>
            )}
        </header>
    );
};

const StickyCTA = ({ pageProgress }: { pageProgress: MotionValue<number> }) => {
    const [dismissed, setDismissed] = useState(false);
    const [active, setActive] = useState(false);
    const [formInView, setFormInView] = useState(false);
    const reduce = useReducedMotion();
    const y = useTransform(pageProgress, [0.05, 0.1], [110, 0]);
    const opacity = useTransform(pageProgress, [0.05, 0.1], [0, 1]);
    useMotionValueEvent(pageProgress, "change", (p) => setActive(p > 0.07));

    // The bar duplicates the form CTA — hide it while the form itself is visible
    useEffect(() => {
        const el = document.getElementById("kontakt");
        if (!el || !("IntersectionObserver" in window)) return;
        const io = new IntersectionObserver(
            (entries) => entries.forEach((e) => setFormInView(e.isIntersecting)),
            { threshold: 0.15 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    if (dismissed) return null;
    const shown = active && !formInView;
    return (
        <motion.div
            className={`fixed inset-x-0 bottom-0 z-40 transition-opacity duration-300 ${shown ? "" : "pointer-events-none opacity-0"}`}
            style={reduce ? { paddingBottom: "env(safe-area-inset-bottom)" } : { y, opacity: shown ? opacity : 0, paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="mx-auto max-w-7xl px-3 pb-3 sm:px-5 sm:pb-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/15 p-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] backdrop-blur-lg sm:p-4" style={{ backgroundColor: "rgba(7,17,35,0.9)" }}>
                    <a
                        href="#kontakt"
                        onClick={() => trackEvent("cta_request_offer_click", { location: "sticky_bar" })}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-mk-pink px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:opacity-90 sm:px-5 sm:text-sm"
                    >
                        Zatraži ponudu
                    </a>
                    <div className="min-w-0 flex-1">
                        <div className="mk-display truncate text-sm uppercase tracking-wide text-white sm:text-base">
                            Postanite dio priče u 2026.
                        </div>
                        <div className="truncate text-[11px] text-white/75 sm:text-xs">
                            Kreiramo paket po mjeri — odgovor u 24h.
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setDismissed(true); trackEvent("sticky_cta_dismiss"); }}
                        aria-label="Zatvori traku s pozivom"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

/* ------------------------------------------------------------------ */
/*  Contact form (posts to the existing /api/contact endpoint)         */
/* ------------------------------------------------------------------ */

const contactSchema = z.object({
    name: z.string().trim().min(2, "Unesite ime (min 2 znaka)").max(120),
    email: z.string().trim().email("Neispravan email").max(255),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    company: z.string().trim().max(160).optional().or(z.literal("")),
    package: z.string().trim().max(80).optional().or(z.literal("")),
    message: z.string().trim().min(10, "Poruka mora imati barem 10 znakova").max(2000),
});
type ContactErrors = Partial<Record<keyof z.infer<typeof contactSchema>, string>>;

const PACKAGES = [
    "Nisam siguran — predložite",
    "Sponzorske površine",
    "Digitalna vidljivost",
    "Aktivacija na terenu",
    "Reklamni materijali",
    "Medijske kampanje",
    "Paket po mjeri",
];

const MarketingContactForm = ({ preselected = "" }: { preselected?: string }) => {
    const [errors, setErrors] = useState<ContactErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [pkg, setPkg] = useState("");

    // Package CTAs around the page pre-fill the select
    useEffect(() => {
        if (preselected) setPkg(PACKAGES.includes(preselected) ? preselected : "Paket po mjeri");
    }, [preselected]);

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setServerError(null);
        const fd = new FormData(e.currentTarget);
        const raw = {
            name: String(fd.get("name") ?? ""),
            email: String(fd.get("email") ?? ""),
            phone: String(fd.get("phone") ?? ""),
            company: String(fd.get("company") ?? ""),
            package: String(fd.get("package") ?? ""),
            message: String(fd.get("message") ?? ""),
        };
        const parsed = contactSchema.safeParse(raw);
        if (!parsed.success) {
            const next: ContactErrors = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0] as keyof ContactErrors;
                if (key && !next[key]) next[key] = issue.message;
            }
            setErrors(next);
            return;
        }
        setErrors({});
        setSubmitting(true);
        try {
            // The shared /api/contact endpoint takes name/email/phone/message,
            // so company + package ride along inside the message body.
            const meta = [
                parsed.data.company && `Tvrtka: ${parsed.data.company}`,
                parsed.data.package && `Zanima ih paket: ${parsed.data.package}`,
                "Izvor: marketing-ponuda",
            ].filter(Boolean).join("\n");
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: parsed.data.name,
                    email: parsed.data.email,
                    phone: parsed.data.phone || "",
                    message: `${meta}\n\n${parsed.data.message}`,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            trackEvent("contact_form_submit", { package: parsed.data.package || null, source: "marketing-ponuda" });
            setSuccess(true);
            (e.target as HTMLFormElement).reset();
        } catch (err) {
            console.error("[marketing_contact_form]", err);
            setServerError("Nešto je pošlo po krivu. Pokušajte ponovno ili nas nazovite.");
        } finally {
            setSubmitting(false);
        }
    }

    if (success) {
        return (
            <div role="status" aria-live="polite" className="rounded-2xl border border-[rgba(76,193,87,0.4)] bg-[rgba(76,193,87,0.1)] p-6">
                <div className="mk-display text-lg uppercase tracking-wide mk-green sm:text-xl">
                    Hvala! Upit je zaprimljen.
                </div>
                <p className="mt-2 text-sm text-white/85 sm:text-base">
                    Javljamo se u roku 24h s prijedlogom paketa po mjeri.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                    <a
                        href="https://dispet.fun/shop"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackEvent("merch_shop_click", { location: "form_success" })}
                        className="inline-flex min-h-11 items-center rounded-full bg-mk-yellow px-5 py-2.5 text-sm font-bold text-on-bright transition hover:opacity-90"
                    >
                        Posjeti trgovinu →
                    </a>
                    <a
                        href="https://instagram.com/dispet.fun"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackEvent("contact_instagram_click", { location: "form_success" })}
                        className="mk-display text-base mk-pink hover:underline"
                    >
                        @dispet.fun
                    </a>
                    <button
                        type="button"
                        onClick={() => setSuccess(false)}
                        className="text-xs font-bold uppercase tracking-widest text-white/70 underline hover:text-white"
                    >
                        Pošalji još jedan upit
                    </button>
                </div>
            </div>
        );
    }

    const labelCls = "text-[11px] font-bold uppercase tracking-[0.18em] text-white/75";
    return (
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                    <span className={labelCls}>Ime i prezime *</span>
                    <input name="name" type="text" required maxLength={120} autoComplete="name" className="mk-input" aria-invalid={!!errors.name} />
                    {errors.name && <span aria-live="polite" className="text-xs mk-pink">{errors.name}</span>}
                </label>
                <label className="grid gap-1.5">
                    <span className={labelCls}>Email *</span>
                    <input name="email" type="email" required maxLength={255} autoComplete="email" className="mk-input" aria-invalid={!!errors.email} />
                    {errors.email && <span aria-live="polite" className="text-xs mk-pink">{errors.email}</span>}
                </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                    <span className={labelCls}>Telefon</span>
                    <input name="phone" type="tel" maxLength={40} autoComplete="tel" className="mk-input" />
                </label>
                <label className="grid gap-1.5">
                    <span className={labelCls}>Tvrtka</span>
                    <input name="company" type="text" maxLength={160} autoComplete="organization" className="mk-input" />
                </label>
            </div>
            <label className="grid gap-1.5">
                <span className={labelCls}>Zanima me paket</span>
                <select name="package" value={pkg} onChange={(e) => setPkg(e.target.value)} className="mk-input">
                    <option value="">— Odaberite —</option>
                    {PACKAGES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
            </label>
            <label className="grid gap-1.5">
                <span className={labelCls}>Poruka *</span>
                <textarea name="message" required rows={5} maxLength={2000} className="mk-input resize-y" aria-invalid={!!errors.message} />
                {errors.message && <span aria-live="polite" className="text-xs mk-pink">{errors.message}</span>}
            </label>
            {serverError && (
                <div role="alert" className="rounded-xl border border-[rgba(247,65,128,0.4)] bg-[rgba(247,65,128,0.1)] px-4 py-3 text-sm">
                    {serverError}
                </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-white/70">Odgovor u 24h. Vaši podatci ostaju kod nas.</p>
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-mk-pink px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitting ? "Šaljem…" : "Pošalji upit"}
                </button>
            </div>
        </form>
    );
};

/* ------------------------------------------------------------------ */
/*  Hero — animates OUT as you scroll (scrubbed both directions)       */
/* ------------------------------------------------------------------ */

const Hero = () => {
    const ref = useRef<HTMLElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

    const line1X = useTransform(scrollYProgress, [0, 1], [0, -70]);
    const line2X = useTransform(scrollYProgress, [0, 1], [0, 70]);
    const titleOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);
    const introY = useTransform(scrollYProgress, [0, 1], [0, 60]);
    const imgY = useTransform(scrollYProgress, [0, 1], [0, 90]);
    const imgScale = useTransform(scrollYProgress, [0, 1], [1, 0.93]);
    const mascotRotate = useTransform(scrollYProgress, [0, 1], [-6, 16]);
    const mascotY = useTransform(scrollYProgress, [0, 1], [0, -50]);
    const blobPinkY = useTransform(scrollYProgress, [0, 1], [0, 140]);
    const blobTealY = useTransform(scrollYProgress, [0, 1], [0, -120]);
    const dotsY = useTransform(scrollYProgress, [0, 1], [0, 80]);

    const mv = (v: MotionValue<number>) => (reduce ? undefined : v);

    return (
        <section id="top" ref={ref} className="relative overflow-hidden">
            <motion.div className="mk-grid-dots absolute inset-0 opacity-50" style={{ y: mv(dotsY) }} />
            <div className="mk-noise pointer-events-none absolute inset-0 opacity-[0.07]" />
            <motion.div
                className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
                style={{ background: "radial-gradient(circle, var(--mk-pink), transparent 60%)", y: mv(blobPinkY) }}
            />
            <motion.div
                className="absolute -right-32 bottom-0 h-[480px] w-[480px] rounded-full opacity-25 blur-3xl"
                style={{ background: "radial-gradient(circle, var(--mk-teal), transparent 60%)", y: mv(blobTealY) }}
            />
            <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-14 md:grid-cols-12 md:gap-10 md:py-24">
                <div className="md:col-span-7 md:pt-8">
                    <motion.div style={{ opacity: mv(titleOpacity) }}>
                        <SectionTag label="Marketing ponuda · 2026" color="teal" />
                        <h1 className="mk-display mt-6 text-[clamp(2.25rem,8vw,5.75rem)] leading-[0.95] text-white">
                            <motion.span className="block" style={{ x: mv(line1X) }}>POKRET KOJI</motion.span>
                            <motion.span className="mk-gradient-pink block" style={{ x: mv(line2X) }}>POKREĆE.</motion.span>
                        </h1>
                    </motion.div>
                    <motion.div style={{ y: mv(introY), opacity: mv(titleOpacity) }}>
                        <p className="mt-6 max-w-lg text-lg leading-snug text-white/85 sm:text-xl">
                            Besplatan dan sporta, edukacije i{" "}
                            <mark className="bg-mk-yellow px-1.5 font-bold text-on-bright">zabave za djecu</mark>{" "}
                            — pokret koji pokreće generaciju.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <a
                                href="#kontakt"
                                onClick={() => trackEvent("cta_request_offer_click", { location: "hero" })}
                                className="inline-flex min-h-11 items-center rounded-full bg-mk-pink px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
                            >
                                Zatraži ponudu
                            </a>
                            <a
                                href="#paketi"
                                onClick={() => trackEvent("hero_cta_packages_click")}
                                className="inline-flex min-h-11 items-center rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                            >
                                Pogledaj pakete
                            </a>
                        </div>
                        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                            <span className="mk-teal">Partneri:</span>
                            <span>HNK Hajduk</span>
                            <span className="h-1 w-1 rounded-full bg-white/30" />
                            <span>Rocket FA</span>
                            <span className="h-1 w-1 rounded-full bg-white/30" />
                            <span>Automall Split</span>
                            <span className="h-1 w-1 rounded-full bg-white/30" />
                            <span>Splitska Dica</span>
                        </div>
                    </motion.div>
                </div>
                <div className="relative md:col-span-5">
                    <motion.div
                        className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-white/10"
                        style={{ y: mv(imgY), scale: mv(imgScale) }}
                    >
                        <img
                            src={IMG.hero}
                            alt="Dišpet — djeca na terenu"
                            className="h-full w-full object-cover"
                            {...({ fetchpriority: "high" } as Record<string, string>)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,17,35,0.85)] via-[rgba(7,17,35,0.1)] to-transparent" />
                        <img
                            src={IMG.logo}
                            alt=""
                            className="absolute -right-5 -top-5 h-20 w-20 rotate-6 drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)] sm:h-24 sm:w-24 md:h-28 md:w-28"
                        />
                        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                            <div>
                                <div className="mk-display text-3xl leading-none text-white">SPLIT</div>
                                <div className="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-white/80">
                                    Baza pokreta · širimo se u 2026.
                                </div>
                            </div>
                            <div className="rounded-full bg-mk-teal px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-on-bright">
                                Cilj · 3 grada
                            </div>
                        </div>
                    </motion.div>
                    <motion.img
                        src={IMG.mascotDance}
                        alt="Dišpet maskota"
                        className="pointer-events-none absolute -bottom-6 -right-2 h-28 w-28 select-none drop-shadow-[0_25px_45px_rgba(0,0,0,0.55)] sm:h-36 sm:w-36 md:-top-8 md:bottom-auto md:right-auto md:h-52 md:w-52 md:-left-44 lg:-left-60 lg:-top-12 lg:h-64 lg:w-64"
                        style={reduce ? undefined : { rotate: mascotRotate, y: mascotY }}
                    />
                </div>
            </div>
        </section>
    );
};

/* ------------------------------------------------------------------ */
/*  Partner marquee — slides horizontally as the page scrolls          */
/* ------------------------------------------------------------------ */

const Marquee = ({ pageProgress }: { pageProgress: MotionValue<number> }) => {
    const reduce = useReducedMotion();
    const x = useTransform(pageProgress, [0, 1], ["2%", "-42%"]);
    const items = ["HNK Hajduk", "Rocket Football Academy", "Automall Split", "Splitska Dica", "dispet.fun", "10.000+ djece"];
    const row = [...items, ...items, ...items];
    return (
        <div className="relative overflow-hidden border-y border-white/10 bg-mk-navy py-4" aria-hidden="true">
            <motion.div className="flex w-max items-center gap-10 whitespace-nowrap" style={reduce ? undefined : { x }}>
                {row.map((t, i) => (
                    <span key={i} className="flex items-center gap-10">
                        <span className="mk-display text-sm uppercase tracking-[0.25em] text-white/45">{t}</span>
                        <span className={`h-2 w-2 rounded-full ${["bg-mk-pink", "bg-mk-teal", "bg-mk-yellow", "bg-mk-green"][i % 4]}`} />
                    </span>
                ))}
            </motion.div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const MarketingPonuda = () => {
    const { scrollYProgress: pageProgress } = useScroll();
    const [preselectedPackage, setPreselectedPackage] = useState("");
    const [activeSection, setActiveSection] = useState<"onama" | "teren" | "sponsor" | "partneri" | null>(null);
    const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number | null>(null);

    const pickPackage = (title: string, location: string) => {
        setPreselectedPackage(title);
        trackEvent("cta_request_offer_click", { location });
    };

    return (
        <div className="mkt-root min-h-screen">
            <SEOHead
                title="Marketing Ponuda 2026"
                description="Dišpet — besplatan dan sporta, edukacije i zabave za djecu. Marketing ponuda 2026: sponzorske površine, digitalna vidljivost, aktivacija na terenu i merch s vašim logom. Split — cilj 2026: 3 grada i 10.000+ djece."
                url="https://dispet.fun/marketing-ponuda"
                image="https://dispet.fun/marketing/hero.jpg"
                schema={SCHEMA_GRAPH}
            />
            <Helmet>
                <link rel="preload" as="image" href={IMG.hero} />
            </Helmet>
            <Nav pageProgress={pageProgress} />
            <StickyCTA pageProgress={pageProgress} />

            <main className="pb-24 sm:pb-28">
                <Hero />

                {/* STATS — counters scrub with scroll */}
                <section className="border-y border-white/10 bg-mk-navy" aria-label="Brojke">
                    <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-white/10">
                        {[
                            { n: "10.000+", l: "Djece · cilj 2026.", c: "mk-teal" },
                            { n: "3", l: "Grada · širenje", c: "mk-pink" },
                            { n: "100K+", l: "Digital reach", c: "mk-yellow" },
                        ].map((s, i) => (
                            <Driven key={s.l} fromY={26} delay={i * 0.04} className="min-w-0 px-2 py-7 text-center sm:px-4 md:py-10">
                                <div className={`mk-display leading-[0.95] ${s.c}`} style={{ fontSize: "clamp(1.5rem, 6vw, 3.75rem)" }}>
                                    <ScrollCount value={s.n} />
                                </div>
                                <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/70 sm:text-xs sm:tracking-[0.22em]">
                                    {s.l}
                                </div>
                            </Driven>
                        ))}
                    </div>
                </section>

                {/* O NAMA — entity definition (GEO answer block) */}
                <section id="o-nama" className="mx-auto max-w-7xl px-5 py-14 sm:py-20 md:py-28">
                    <div className="grid gap-12 md:grid-cols-12">
                        <div className="md:col-span-5">
                            <Driven fromX={-56} fromY={0}>
                                <SectionTag label="O nama" color="yellow" />
                                <h2 className="mk-display mt-5 leading-[1.02] text-[clamp(2rem,6vw,3.5rem)] text-white">
                                    ŠTO JE <span className="mk-yellow">DIŠPET?</span>
                                </h2>
                                <DrivenRule className="mt-4 max-w-[180px] rounded-full" />
                            </Driven>
                            <Driven fromY={36} delay={0.05}>
                                <p className="mt-6 text-lg text-white/80">
                                    Dišpet nije događaj — Dišpet je <strong className="text-white">pokret i projekt</strong> koji
                                    spaja <strong className="text-white">zabavu, sport i edukaciju</strong> za djecu predškolske
                                    dobi i nižih razreda osnovne škole.
                                </p>
                                <p className="mt-4 text-lg text-white/80">
                                    Financira se isključivo od sponzora — za svu djecu uvijek{" "}
                                    <mark className="bg-mk-yellow px-1.5 font-bold text-on-bright">BESPLATNO!</mark>
                                </p>
                            </Driven>
                            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                {[
                                    { l: "Sport", c: "bg-mk-teal text-on-bright" },
                                    { l: "Edukacija", c: "bg-mk-green text-on-bright" },
                                    { l: "Digital", c: "bg-mk-yellow text-on-bright" },
                                    { l: "Kreativa", c: "bg-mk-pink text-white" },
                                ].map((p, i) => (
                                    <Driven key={p.l} fromY={28} fromScale={0.8} fromRotate={i % 2 ? 4 : -4} delay={i * 0.05}>
                                        <span className={`block rounded-xl px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider ${p.c}`}>
                                            {p.l}
                                        </span>
                                    </Driven>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-7">
                            <SectionGalleryRow
                                photos={SECTION_PHOTOS.onama}
                                progress={pageProgress}
                                direction="left"
                                offset={0}
                                accentColor="var(--mk-yellow)"
                                shadowColor="rgba(249,198,53,0.5)"
                                onPhotoClick={(idx) => {
                                    setActiveSection("onama");
                                    setSelectedPhotoIdx(idx);
                                }}
                            />
                        </div>
                    </div>
                </section>

                {/* NA TERENU — live proof */}
                <section id="teren" className="relative bg-mk-navy py-14 sm:py-20 md:py-28">
                    <div className="mx-auto max-w-7xl px-5">
                        <div className="grid items-end gap-6 md:grid-cols-12">
                            <Driven fromX={-56} fromY={0} className="md:col-span-8">
                                <SectionTag label="Na terenu" color="pink" />
                                <h2 className="mk-display mt-5 leading-[1.02] text-[clamp(2rem,6vw,3.5rem)] text-white">
                                    DIŠPET <span className="mk-pink">U AKCIJI.</span>
                                </h2>
                                <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
                                    Svako događanje je puna energija, smijeh i sport. Profesionalni kadar, pravi momenti,
                                    stvarni efekt — diljem Dalmacije.
                                </p>
                            </Driven>
                            <Driven fromX={40} fromY={0} delay={0.06} className="text-xs font-bold uppercase tracking-[0.25em] text-white/70 md:col-span-4 md:text-right">
                                Rekreacija · Edukacija · Iskustvo · 2025.
                            </Driven>
                        </div>
                        <div className="mt-10">
                            <SectionGalleryRow
                                photos={SECTION_PHOTOS.teren}
                                progress={pageProgress}
                                direction="right"
                                offset={4}
                                accentColor="var(--mk-pink)"
                                shadowColor="rgba(247,65,128,0.5)"
                                onPhotoClick={(idx) => {
                                    setActiveSection("teren");
                                    setSelectedPhotoIdx(idx);
                                }}
                            />
                        </div>
                    </div>
                </section>

                <Marquee pageProgress={pageProgress} />

                {/* ZAŠTO DIŠPET */}
                <section id="zasto" className="bg-mk-navy py-14 sm:py-20 md:py-28">
                    <div className="mx-auto max-w-7xl px-5">
                        <Driven fromY={40} className="max-w-3xl">
                            <SectionTag label="Zašto Dišpet" color="pink" />
                            <h2 className="mk-display mt-5 leading-[1.02] text-[clamp(2rem,6vw,3.5rem)] text-white">
                                ZAŠTO SPONZORI <span className="mk-pink">BIRAJU DIŠPET?</span>
                            </h2>
                            <DrivenRule className="mt-4 max-w-[240px] rounded-full" />
                        </Driven>
                        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                { t: "Direktan kontakt", d: "S djecom i roditeljima na terenu, oči u oči.", c: "mk-teal" },
                                { t: "Brend kroz igru", d: "Vaš logo viđen kroz pokret, ne kroz reklamu.", c: "mk-pink" },
                                { t: "Pozitivne asocijacije", d: "Sport, zabava, zdravlje — vrijednosti koje grade brend.", c: "mk-yellow" },
                                { t: "Lokalna zajednica", d: "Split kao baza — širenje na 3 grada u 2026.", c: "mk-green" },
                                { t: "Foto & video", d: "Profesionalna dokumentacija s vašim logom.", c: "mk-teal" },
                                { t: "100.000+ impressions", d: "Digital reach kroz cijelu sezonu.", c: "mk-pink" },
                            ].map((b, i) => (
                                <Driven key={b.t} fromY={56} fromScale={0.94} delay={(i % 3) * 0.05}>
                                    <article className="mk-ring-gradient h-full rounded-2xl border border-white/10 bg-mk-card p-6 transition duration-300 hover:-translate-y-1.5 hover:mk-glow-pink">
                                        <h3 className={`mk-display text-base uppercase tracking-wide ${b.c}`}>{b.t}</h3>
                                        <p className="mt-2 text-sm text-white/75 sm:text-base">{b.d}</p>
                                    </article>
                                </Driven>
                            ))}
                        </div>
                        <CtaRow location="after_zasto" />
                    </div>
                </section>

                {/* PAKETI */}
                <section id="paketi" className="mx-auto max-w-7xl px-5 py-14 sm:py-20 md:py-28">
                    <Driven fromY={40}>
                        <SectionTag label="Sponzorski paketi" color="yellow" />
                        <h2 className="mk-display mt-5 max-w-3xl leading-[1.02] text-[clamp(2rem,6vw,3.5rem)] text-white">
                            MARKETING <span className="mk-yellow">MOGUĆNOSTI.</span>
                        </h2>
                        <p className="mt-5 max-w-2xl text-base text-white/70 sm:text-lg">
                            Pet ravnopravnih kanala kroz koje gradimo vašu vidljivost — birajte jedan ili kombinirajte
                            sve u paket po mjeri.
                        </p>
                    </Driven>
                    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            { n: "01", t: "Sponzorske površine", d: "150m+ ograde, brendirani paneli i logo na svim materijalima na terenu.", c: "bg-mk-teal" },
                            { n: "02", t: "Digitalna vidljivost", d: "dispet.fun, društvene mreže, foto i video sadržaj te newsletter.", c: "bg-mk-pink" },
                            { n: "03", t: "Aktivacija na terenu", d: "Vlastiti štand, dijeljenje proizvoda i sponzorstvo igara.", c: "bg-mk-yellow" },
                            { n: "04", t: "Reklamni materijali", d: "Majice i oprema s vašim logom, pokloni za djecu, web integracija.", c: "bg-mk-green" },
                            { n: "05", t: "Medijske kampanje", d: "Zajednički PR nastup i koordinirane kampanje na svim kanalima.", c: "bg-mk-pink" },
                        ].map((p, i) => (
                            <Driven key={p.n} fromX={i % 2 ? 56 : -56} fromY={24} delay={(i % 3) * 0.04}>
                                <article className="mk-ring-gradient group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-mk-card p-6 transition duration-300 hover:-translate-y-1.5 hover:mk-glow-teal">
                                    <span className="mk-ghost-num" aria-hidden>{p.n}</span>
                                    <div className={`mk-display inline-flex h-12 w-12 items-center justify-center rounded-xl ${p.c} text-xl text-on-bright transition duration-500 group-hover:rotate-3 group-hover:scale-110`}>
                                        {p.n}
                                    </div>
                                    <h3 className="mk-display mt-5 text-xl text-white sm:text-2xl">{p.t}</h3>
                                    <p className="mt-3 flex-1 text-sm text-white/75 sm:text-base">{p.d}</p>
                                    <a
                                        href="#kontakt"
                                        onClick={() => pickPackage(p.t, `package_${p.n}`)}
                                        className="relative mt-5 inline-flex items-center text-xs font-bold uppercase tracking-widest mk-pink transition hover:underline"
                                    >
                                        Zatraži ponudu →
                                    </a>
                                </article>
                            </Driven>
                        ))}
                        <Driven fromY={40} fromScale={0.95} delay={0.08}>
                            <a
                                href="#kontakt"
                                onClick={() => pickPackage("Paket po mjeri", "packages_custom")}
                                className="flex h-full min-h-[200px] flex-col justify-between rounded-2xl border border-dashed border-white/30 bg-transparent p-6 transition hover:border-[var(--mk-pink)] hover:bg-[rgba(247,65,128,0.05)]"
                            >
                                <div>
                                    <div className="mk-display text-xl mk-pink sm:text-2xl">Paket po mjeri</div>
                                    <p className="mt-3 text-sm text-white/80 sm:text-base">
                                        Kombiniramo sve elemente prema vašim ciljevima i budžetu. Sve je moguće.
                                    </p>
                                </div>
                                <div className="mt-6 text-sm font-bold uppercase tracking-widest text-white">
                                    Dogovorite poziv →
                                </div>
                            </a>
                        </Driven>
                    </div>
                </section>

                {/* SPONZORSKE POVRŠINE — detail behind package 01 */}
                <section className="mx-auto max-w-7xl px-5 pb-14 sm:pb-20 md:pb-28">
                    <div className="grid gap-12 md:grid-cols-12">
                        <div className="md:col-span-6">
                            <SectionGalleryRow
                                photos={SECTION_PHOTOS.sponsor}
                                progress={pageProgress}
                                direction="left"
                                offset={2}
                                accentColor="var(--mk-teal)"
                                shadowColor="rgba(0,196,196,0.5)"
                                onPhotoClick={(idx) => {
                                    setActiveSection("sponsor");
                                    setSelectedPhotoIdx(idx);
                                }}
                            />
                        </div>
                        <div className="md:col-span-6">
                            <Driven fromX={48} fromY={0}>
                                <SectionTag label="Sponzorske površine" color="teal" />
                                <h2 className="mk-display mt-5 leading-[1.02] text-[clamp(2rem,6vw,3.5rem)] text-white">
                                    VAŠA REKLAMA <span className="mk-teal">NA TERENU.</span>
                                </h2>
                                <p className="mt-5 text-base text-white/75 sm:text-lg">
                                    Brendirane površine koje okružuju svako Dišpet događanje. Vaš logo vidljiv kroz sport,
                                    igru i pokret — a ne kroz reklamu.
                                </p>
                            </Driven>
                            <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-4">
                                {[
                                    { n: "150m+", l: "Sponzorske površine" },
                                    { n: "Teren", l: "+ ograda i okolica" },
                                    { n: "Sve", l: "Lokacije u gradu" },
                                ].map((s, i) => (
                                    <Driven key={s.l} fromY={40} fromScale={0.9} delay={0.06 + i * 0.05}>
                                        <div className="min-w-0 rounded-xl border border-white/10 bg-mk-card p-3 transition duration-300 hover:border-[rgba(249,198,53,0.5)] sm:p-4">
                                            <div className="mk-display leading-none mk-yellow" style={{ fontSize: "clamp(1rem, 3.2vw, 1.5rem)" }}>
                                                {/^[\d.,]/.test(s.n) ? <ScrollCount value={s.n} /> : s.n}
                                            </div>
                                            <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/70 sm:text-xs">
                                                {s.l}
                                            </div>
                                        </div>
                                    </Driven>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* DIGITAL */}
                <section id="digital" className="bg-mk-navy py-14 sm:py-20 md:py-28">
                    <div className="mx-auto max-w-7xl px-5">
                        <Driven fromY={40} className="max-w-3xl">
                            <SectionTag label="Online ekosustav" color="teal" />
                            <h2 className="mk-display mt-5 leading-[1.02] text-[clamp(2rem,6vw,3.5rem)] text-white">
                                DISPET.<span className="mk-teal">FUN</span>
                            </h2>
                            <p className="mt-5 text-base text-white/75 sm:text-lg">
                                Više od web stranice — kompletan digitalni ekosustav koji radi za vas 24/7.
                            </p>
                        </Driven>

                        <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
                            {[
                                { n: "2.000+", l: "Članova Kluba", c: "mk-pink" },
                                { n: "100K+", l: "Digital reach godišnje", c: "mk-teal" },
                                { n: "24/7", l: "Vidljivost vašeg loga", c: "mk-yellow" },
                            ].map((s, i) => (
                                <Driven key={s.l} fromY={44} delay={i * 0.05}>
                                    <div className="min-w-0 rounded-2xl border border-white/10 bg-mk-card p-3 transition duration-300 hover:border-white/25 sm:p-5">
                                        <div className={`mk-display leading-none ${s.c}`} style={{ fontSize: "clamp(1.25rem, 4.5vw, 1.875rem)" }}>
                                            {/^[\d.,]/.test(s.n) ? <ScrollCount value={s.n} /> : s.n}
                                        </div>
                                        <div className="mt-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/70 sm:text-xs">
                                            {s.l}
                                        </div>
                                    </div>
                                </Driven>
                            ))}
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { t: "Web trgovina", d: "Majice, hoodiesi, kape, termosice — s opcijom sponzorskog loga.", c: "border-t-[var(--mk-teal)]", icon: "🛍️", href: "https://dispet.fun/shop" },
                                { t: "Dječji kutak", d: "AI treninzi, igre za mozak i edukativni sadržaj za djecu.", c: "border-t-[var(--mk-yellow)]", icon: "🧠", href: "/games" },
                                { t: "Dišpet Klub", d: "Membership, popusti i merch drops — 2.000+ članova.", c: "border-t-[var(--mk-pink)]", icon: "💛", href: null },
                                { t: "Blog & novosti", d: "Eventi i profesionalni sadržaj — istaknuto partnerstvo.", c: "border-t-[var(--mk-green)]", icon: "📰", href: "/blog" },
                            ].map((c, i) => (
                                <Driven key={c.t} fromY={52} fromScale={0.95} delay={(i % 4) * 0.045}>
                                    <div className={`h-full rounded-2xl border border-white/10 border-t-4 ${c.c} bg-mk-card p-5 transition duration-500 hover:-translate-y-1.5`}>
                                        <div className="text-2xl" aria-hidden>{c.icon}</div>
                                        <h3 className="mk-display mt-3 text-lg text-white">
                                            {c.href ? (
                                                <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel={c.href.startsWith("http") ? "noreferrer" : undefined} className="hover:underline">
                                                    {c.t}
                                                </a>
                                            ) : c.t}
                                        </h3>
                                        <p className="mt-2 text-sm text-white/70">{c.d}</p>
                                    </div>
                                </Driven>
                            ))}
                        </div>

                        <Driven fromY={44}>
                            <div className="mt-6 rounded-2xl border border-white/10 bg-mk-card p-6 sm:p-8">
                                <div className="mk-display text-base uppercase tracking-wide text-white/90 sm:text-xl">
                                    Zašto digitalno znači više za vas?
                                </div>
                                <ul className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
                                    {[
                                        "Logo vidljiv na svim stranicama i u web shopu",
                                        "Istaknuto partnerstvo u blog postovima i newsletteru",
                                        "Ekskluzivne akcije za Dišpet Klub članove u vaše ime",
                                        "100.000+ digital impressions godišnje",
                                    ].map((b) => (
                                        <li key={b} className="flex items-start gap-3">
                                            <span className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-mk-pink" />
                                            <span className="text-sm text-white/85 sm:text-base">{b}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Driven>
                        <CtaRow location="after_digital" />
                    </div>
                </section>

                {/* CILJEVI 2026 */}
                <section className="relative overflow-hidden">
                    <div className="mk-rainbow absolute inset-0 opacity-10" />
                    <div className="relative mx-auto max-w-7xl px-5 py-20 md:py-24">
                        <div className="grid items-center gap-10 md:grid-cols-12">
                            <Driven fromX={-56} fromY={0} className="md:col-span-5">
                                <SectionTag label="Ciljevi 2026." color="teal" />
                                <h2 className="mk-display mt-5 leading-[1.02] text-[clamp(2rem,6vw,3.5rem)] text-white">
                                    KAMO <span className="mk-teal">IDEMO.</span>
                                </h2>
                                <p className="mt-5 text-base text-white/75 sm:text-lg">
                                    Jasni, mjerljivi ciljevi za iduću sezonu — i mjesto za vaš brend u svakoj brojci.
                                </p>
                            </Driven>
                            <div className="md:col-span-7">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Driven fromY={56} fromScale={0.93} delay={0.04}>
                                        <div className="mk-ring-gradient h-full min-w-0 rounded-2xl border border-white/15 bg-mk-card p-6 transition duration-500 hover:-translate-y-1 hover:mk-glow-teal">
                                            <div className="mk-display leading-[0.95] mk-teal" style={{ fontSize: "clamp(2rem, 6vw, 3rem)" }}>
                                                <ScrollCount value="10.000+" />
                                            </div>
                                            <div className="mk-display mt-2 text-sm uppercase tracking-wide text-white">Djece u 2026.</div>
                                            <p className="mt-2 text-sm text-white/70">Više besplatnih događanja, više djece u pokretu.</p>
                                        </div>
                                    </Driven>
                                    <Driven fromY={56} fromScale={0.93} delay={0.1}>
                                        <div className="mk-ring-gradient h-full min-w-0 rounded-2xl border border-white/15 bg-mk-card p-6 transition duration-500 hover:-translate-y-1 hover:mk-glow-pink">
                                            <div className="mk-display leading-[0.95] mk-pink" style={{ fontSize: "clamp(2rem, 6vw, 3rem)" }}>
                                                <ScrollCount value="3" /> grada
                                            </div>
                                            <div className="mk-display mt-2 text-sm uppercase tracking-wide text-white">Dišpet se širi</div>
                                            <p className="mt-2 text-sm text-white/70">Split kao baza + dva nova grada na karti Dišpeta.</p>
                                        </div>
                                    </Driven>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PARTNERI — proof directly before the ask */}
                <section id="partneri" className="bg-mk-navy py-14 sm:py-20 md:py-28">
                    <div className="mx-auto max-w-7xl px-5">
                        <div className="grid gap-10 md:grid-cols-12">
                            <div className="md:col-span-5">
                                <Driven fromX={-48} fromY={0}>
                                    <SectionTag label="Zajednica" color="teal" />
                                    <h2 className="mk-display mt-5 leading-[1.02] text-[clamp(2rem,6vw,3.5rem)] text-white">
                                        NAŠI <span className="mk-teal">PARTNERI.</span>
                                    </h2>
                                    <p className="mt-5 text-base text-white/75 sm:text-lg">
                                        Partneri koji dijele jednu viziju — aktivna i educirana djeca Hrvatske.
                                    </p>
                                </Driven>
                                <Driven fromY={48} delay={0.05} className="mt-6 overflow-hidden rounded-2xl ring-1 ring-white/10">
                                    <Parallax dist={20}>
                                        <img src={IMG.partners} alt="Dišpet partneri" className="aspect-[4/3] w-full scale-110 object-cover" loading="lazy" />
                                    </Parallax>
                                </Driven>
                            </div>
                            <div className="md:col-span-7">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {[
                                        { t: "HNK Hajduk", d: "Dječja tribina Poljud + Hajduk Fan Shop aktivacija.", c: "mk-pink" },
                                        { t: "Rocket Football Academy", d: "Partnerstvo s akademijom Ivana Rakitića.", c: "mk-teal" },
                                        { t: "Automall Split", d: "Strateški partner — 400+ djece u autosalonu.", c: "mk-yellow" },
                                        { t: "Splitska Dica", d: "Zajednički festival Split za djecu — sport, igra i edukacija.", c: "mk-green" },
                                    ].map((p, i) => (
                                        <Driven key={p.t} fromX={i % 2 ? 48 : -48} fromY={20} delay={(i % 2) * 0.05}>
                                            <article className="mk-ring-gradient h-full rounded-2xl border border-white/10 bg-mk-card p-5 transition duration-500 hover:-translate-y-1 hover:border-white/25">
                                                <h3 className={`mk-display text-lg sm:text-xl ${p.c}`}>{p.t}</h3>
                                                <p className="mt-2 text-sm text-white/75">{p.d}</p>
                                            </article>
                                        </Driven>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <SectionGalleryRow
                                        photos={SECTION_PHOTOS.partneri}
                                        progress={pageProgress}
                                        direction="right"
                                        offset={6}
                                        accentColor="var(--mk-green)"
                                        shadowColor="rgba(76,193,87,0.5)"
                                        onPhotoClick={(idx) => {
                                            setActiveSection("partneri");
                                            setSelectedPhotoIdx(idx);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA / KONTAKT */}
                <section id="kontakt" className="relative overflow-hidden" style={{ scrollMarginTop: "80px" }}>
                    <Parallax dist={-60} className="absolute -right-32 top-10 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, var(--mk-pink), transparent 60%)" }}>
                        <span />
                    </Parallax>
                    <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-12 md:py-28">
                        <div className="md:col-span-6">
                            <Driven fromY={44}>
                                <SectionTag label="Kontakt" color="pink" />
                                <h2 className="mk-display mt-5 leading-[1.02] text-[clamp(2rem,7vw,4.25rem)] text-white">
                                    POKRENIMO <span className="mk-pink">GENERACIJU.</span>
                                </h2>
                                <p className="mt-6 max-w-xl text-base text-white/85 sm:text-xl">
                                    „Zajedno gradimo generaciju koja se kreće, uči i raste." Ispunite formu — javljamo se u
                                    roku 24h s prijedlogom paketa po mjeri.
                                </p>
                            </Driven>
                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                {[
                                    { href: "tel:+385955144085", label: "Telefon", value: "+385 95 514 4085", color: "text-white", event: "contact_phone_click" },
                                    { href: "https://www.dispet.fun", label: "Web", value: "dispet.fun", color: "mk-yellow", event: "contact_web_click" },
                                    { href: "https://instagram.com/dispet.fun", label: "Instagram", value: "@dispet.fun", color: "mk-pink", event: "contact_instagram_click" },
                                ].map((c, i) => (
                                    <Driven key={c.label} fromY={36} fromScale={0.94} delay={0.05 + i * 0.05}>
                                        <a
                                            href={c.href}
                                            target={c.href.startsWith("http") ? "_blank" : undefined}
                                            rel={c.href.startsWith("http") ? "noreferrer" : undefined}
                                            onClick={() => trackEvent(c.event, { channel: c.label.toLowerCase() })}
                                            className="block min-h-11 min-w-0 rounded-2xl border border-white/15 bg-mk-card p-4 transition duration-300 hover:-translate-y-1 hover:border-[var(--mk-pink)]"
                                        >
                                            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">{c.label}</div>
                                            <div className={`mk-display mt-1.5 truncate text-base sm:text-lg ${c.color}`}>{c.value}</div>
                                        </a>
                                    </Driven>
                                ))}
                            </div>
                            <Driven fromY={24} delay={0.1}>
                                <p className="mt-6 text-sm leading-relaxed text-white/75">
                                    Hvala što podržavaš ovu priču. Hvala što vjeruješ u nas. I hvala što svojim izborom
                                    pomažeš nama — da mi možemo pomoći djeci.
                                </p>
                            </Driven>
                        </div>
                        <Driven fromX={56} fromY={24} fromScale={0.97} delay={0.05} className="md:col-span-6">
                            <div className="rounded-2xl border border-white/10 bg-mk-card p-5 ring-1 ring-white/5 sm:p-7">
                                <div className="mb-5 flex items-center gap-3">
                                    <img src={IMG.mascotWave} alt="" aria-hidden="true" className="h-12 w-12 object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]" />
                                    <div>
                                        <div className="mk-display text-base uppercase tracking-wide text-white sm:text-lg">
                                            Zatraži ponudu
                                        </div>
                                        <div className="text-xs text-white/70">Odgovor u 24h · bez obaveze</div>
                                    </div>
                                </div>
                                <MarketingContactForm preselected={preselectedPackage} />
                            </div>
                        </Driven>
                    </div>

                    {/* FAQ — answers verbatim from page copy; also exposed as FAQPage schema */}
                    <div className="relative mx-auto max-w-7xl px-5 pb-16 md:pb-20">
                        <Driven fromY={32}>
                            <h3 className="mk-display text-base uppercase tracking-wide text-white/90 sm:text-xl">
                                Česta pitanja
                            </h3>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {FAQ_ITEMS.map((f) => (
                                    <details key={f.q} className="group rounded-2xl border border-white/10 bg-mk-card p-5 open:border-white/20">
                                        <summary className="mk-display flex cursor-pointer list-none items-center justify-between gap-3 text-base text-white [&::-webkit-details-marker]:hidden">
                                            {f.q}
                                            <span className="text-xl leading-none text-white/70 transition-transform duration-300 group-open:rotate-45" aria-hidden>+</span>
                                        </summary>
                                        <p className="mt-3 text-sm text-white/75 sm:text-base">{f.a}</p>
                                    </details>
                                ))}
                            </div>
                        </Driven>
                    </div>
                </section>

                {/* MERCH — own zone after the sponsor funnel */}
                <section id="merch" className="relative overflow-x-clip bg-mk-navy py-14 sm:py-20 md:py-28">
                    <div className="mx-auto max-w-7xl px-5">
                        <div className="grid items-end gap-8 md:grid-cols-12">
                            <Driven fromX={-56} fromY={0} className="md:col-span-7">
                                <SectionTag label="Merch kolekcija 2026" color="pink" />
                                <h2 className="mk-display mt-5 leading-[1.02] text-[clamp(2rem,6vw,3.5rem)] text-white">
                                    DIŠPET <span className="mk-pink">MERCH.</span>
                                </h2>
                                <p className="mt-5 text-base text-white/75 sm:text-lg">
                                    Sve kolekcije dostupne i s logom vašeg brenda.
                                </p>
                            </Driven>
                            <Driven fromX={40} fromY={0} delay={0.06} className="flex flex-wrap gap-2 md:col-span-5 md:justify-end">
                                <span className="rounded-full border border-[rgba(249,198,53,0.4)] bg-[rgba(249,198,53,0.1)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest mk-yellow">
                                    🇭🇷 100% hrvatski proizvod
                                </span>
                                <span className="rounded-full border border-white/30 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/90">
                                    Dizajn & tisak u Dalmaciji
                                </span>
                                <span className="rounded-full border border-[rgba(247,65,128,0.4)] bg-[rgba(247,65,128,0.1)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest mk-pink">
                                    Zarada → razvoj Dišpeta
                                </span>
                            </Driven>
                        </div>

                        <Driven fromY={44} fromScale={0.97}>
                            <div className="mt-8 grid gap-4 rounded-2xl border border-[rgba(249,198,53,0.4)] bg-[rgba(249,198,53,0.1)] p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
                                <div>
                                    <div className="mk-display text-lg uppercase tracking-wide mk-yellow sm:text-xl">
                                        Svaka kupnja = jedno dijete više na terenu
                                    </div>
                                    <p className="mt-2 text-sm text-white/80 sm:text-base">
                                        Sva zarada od prodaje Dišpet artikala ide isključivo u razvoj projekta — nove lokacije,
                                        opremu i besplatna događanja za djecu.
                                    </p>
                                </div>
                                <a
                                    href="https://dispet.fun/shop"
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => trackEvent("merch_shop_click", { location: "merch_banner" })}
                                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-mk-yellow px-5 py-2.5 text-sm font-bold text-on-bright transition hover:opacity-90"
                                >
                                    Posjeti trgovinu →
                                </a>
                            </div>
                        </Driven>
                    </div>

                    {/* 3D revija + galerija — sticky scroll track: one product at a
                        time with glitch design transitions, the real product
                        photography sliding underneath as a clickable layer */}
                    <MerchShowcase3D />

                    <div className="mx-auto max-w-7xl px-5">
                        <Driven fromY={40}>
                            <div className="mt-8 rounded-2xl border border-white/10 bg-mk-navy-deep p-5 sm:p-6">
                                <div className="mk-display text-xs uppercase tracking-[0.25em] mk-teal sm:text-sm">
                                    Kolekcije dizajna
                                </div>
                                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                    {[
                                        { t: "Street", d: "Ulična Moda", c: "mk-pink" },
                                        { t: "Logo", d: "Logotip", c: "mk-teal" },
                                        { t: "Vintage", d: "Vintage Stil", c: "mk-yellow" },
                                    ].map((t) => (
                                        <div key={t.t} className="rounded-xl border border-white/5 bg-mk-card p-4">
                                            <div className={`mk-display text-base ${t.c}`}>{t.t}</div>
                                            <div className="mt-1 text-sm text-white/70">{t.d}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Driven>
                        {/* Closing CTA — the zone now ends with an exit to the shop */}
                        <Driven fromY={28} className="mt-10 text-center">
                            <a
                                href="https://dispet.fun/shop"
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackEvent("merch_shop_click", { location: "merch_end" })}
                                className="inline-flex min-h-11 items-center justify-center rounded-full bg-mk-yellow px-8 py-3 text-sm font-bold text-on-bright transition hover:opacity-90"
                            >
                                Posjeti trgovinu →
                            </a>
                        </Driven>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="border-t border-white/10 bg-mk-navy-deep">
                <DrivenRule />
                <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-5 py-8 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2.5">
                        <img src={IMG.logo} alt="Dišpet" width={40} height={40} className="h-10 w-10 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" />
                        <span className="mk-display text-base text-white">
                            DI<span className="mk-pink">Š</span>PET
                        </span>
                    </div>
                    <div className="text-[11px] uppercase tracking-widest">
                        HNK Hajduk · Automall Split · Splitska Dica · Rocket FA
                    </div>
                    <div className="text-xs">© 2026 Dišpet · dispet.fun · +385 95 514 4085</div>
                </div>
            </footer>
            <AnimatePresence>
                {activeSection && selectedPhotoIdx !== null && (
                    <GalleryLightbox
                        photos={SECTION_PHOTOS[activeSection]}
                        selected={selectedPhotoIdx}
                        setSelected={(idx) => {
                            setSelectedPhotoIdx(idx);
                            if (idx === null) setActiveSection(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MarketingPonuda;
