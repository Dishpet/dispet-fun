// force deploy trigger
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode, type CSSProperties } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useTransform,
    useSpring,
    useMotionValueEvent,
    useInView,
    animate,
    type MotionValue,
} from "framer-motion";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { SEOHead } from "@/components/SEOHead";
import { MerchShowcase3D } from "@/components/marketing/MerchShowcase3D";
import "./marketing-ponuda.css";

/* ------------------------------------------------------------------ */
/*  Assets (dynamically imported from the gallery folder)              */
/* ------------------------------------------------------------------ */
const A = (name: string) => `/marketing/${name}`;
const IMG = {
    hero: A("hero.jpg"),
    logo: A("dispet-logo-official.png"),
    mascotWave: A("dispet-mascot-wave.gif"),
    mascotDance: A("dispet-mascot-dance.gif"),
};

// Import all real gallery images and videos used on the home page
const galleryImagesMap = import.meta.glob("@/assets/gallery/dispet galerija (*).webp", { eager: true, import: 'default' });
const galleryVideosMap = import.meta.glob(["@/assets/gallery/*.webm", "@/assets/gallery/*.mp4"], { eager: true, import: 'default' });

const allImages = Object.values(galleryImagesMap) as string[];
const allVideos = Object.values(galleryVideosMap) as string[];

/** Helper to render either video or image transparently */
const MediaItem = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    const isVideo = src.endsWith('.webm') || src.endsWith('.mp4');
    if (isVideo) {
        return (
            <video
                src={src}
                autoPlay
                loop
                muted
                playsInline
                className={className}
            />
        );
    }
    return <img src={src} alt={alt} loading="lazy" className={className} />;
};

/** All section photos for the lightbox — grouped by section */
const SECTION_PHOTOS = {
    onama: [allVideos[0] || allImages[0], allImages[1], allImages[2], allImages[3], allImages[4], allImages[5]],
    teren: [allImages[6], allVideos[1] || allImages[7], allImages[8], allImages[9], allImages[10], allImages[11]],
    sponsor: [allVideos[2] || allImages[12], allImages[13], allImages[14]],
    partneri: [allImages[15], allImages[16], allVideos[3] || allImages[17], allImages[18]],
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
                <MediaItem src={photos[selected]} alt="Dišpet fotografija" className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl" />
                <div className="mt-4 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md">
                    {selected + 1} / {photos.length}
                </div>
            </motion.div>
        </motion.div>
    );
};

const AboutCollage = ({
    photos,
    accentColor = "var(--mk-yellow)",
    shadowColor = "rgba(249,198,53,0.5)",
    onPhotoClick,
}: {
    photos: string[];
    accentColor?: string;
    shadowColor?: string;
    onPhotoClick: (idx: number) => void;
}) => {
    return (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Driven fromY={20} className="col-span-3">
                <button
                    type="button"
                    onClick={() => onPhotoClick(0)}
                    className="group relative w-full aspect-[16/9] sm:aspect-[2/1] cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 transition-all duration-500 hover:scale-[1.02] hover:border-[var(--hover-border)] hover:shadow-[var(--hover-shadow)] focus-visible:outline-none"
                    style={{
                        ["--hover-border" as string]: accentColor,
                        ["--hover-shadow" as string]: `0 20px 40px -15px ${shadowColor}`,
                    } as CSSProperties}
                >
                    <MediaItem
                        src={photos[0]}
                        alt="Dišpet o nama 1"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30" />
                </button>
            </Driven>
            {[1, 2, 3].map((i) => (
                <Driven key={i} fromY={20} delay={i * 0.1} className="col-span-1">
                    <button
                        type="button"
                        onClick={() => onPhotoClick(i)}
                        className="group relative w-full aspect-square sm:aspect-[4/3] cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 transition-all duration-500 hover:scale-[1.05] hover:border-[var(--hover-border)] hover:shadow-[var(--hover-shadow)] focus-visible:outline-none"
                        style={{
                            ["--hover-border" as string]: accentColor,
                            ["--hover-shadow" as string]: `0 20px 40px -15px ${shadowColor}`,
                        } as CSSProperties}
                    >
                        <MediaItem
                            src={photos[i]}
                            alt={`Dišpet o nama ${i + 1}`}
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30" />
                    </button>
                </Driven>
            ))}
        </div>
    );
};

const TerenCollage = ({
    photos,
    accentColor = "var(--mk-pink)",
    shadowColor = "rgba(247,65,128,0.5)",
    onPhotoClick,
}: {
    photos: string[];
    accentColor?: string;
    shadowColor?: string;
    onPhotoClick: (idx: number) => void;
}) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[0, 1, 2, 3].map((i) => (
                <Driven key={i} fromY={30} delay={i * 0.05}>
                    <button
                        type="button"
                        onClick={() => onPhotoClick(i)}
                        className="group relative w-full aspect-[3/4] cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 transition-all duration-500 hover:scale-[1.03] hover:border-[var(--hover-border)] hover:shadow-[var(--hover-shadow)] focus-visible:outline-none"
                        style={{
                            ["--hover-border" as string]: accentColor,
                            ["--hover-shadow" as string]: `0 20px 40px -15px ${shadowColor}`,
                        } as CSSProperties}
                    >
                        <MediaItem
                            src={photos[i]}
                            alt={`Dišpet teren ${i + 1}`}
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30" />
                    </button>
                </Driven>
            ))}
        </div>
    );
};

const SponsorCollage = ({
    photos,
    accentColor = "var(--mk-teal)",
    shadowColor = "rgba(0,196,196,0.5)",
    onPhotoClick,
}: {
    photos: string[];
    accentColor?: string;
    shadowColor?: string;
    onPhotoClick: (idx: number) => void;
}) => {
    return (
        <Driven fromY={20}>
            <button
                type="button"
                onClick={() => onPhotoClick(0)}
                className="group relative w-full aspect-[4/3] sm:aspect-[16/9] cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 transition-all duration-500 hover:scale-[1.02] hover:border-[var(--hover-border)] hover:shadow-[var(--hover-shadow)] focus-visible:outline-none"
                style={{
                    ["--hover-border" as string]: accentColor,
                    ["--hover-shadow" as string]: `0 20px 40px -15px ${shadowColor}`,
                } as CSSProperties}
            >
                <MediaItem
                    src={photos[0]}
                    alt="Dišpet sponzorstvo"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30" />
            </button>
        </Driven>
    );
};

const PartneriCollage = ({
    photos,
    accentColor = "var(--mk-green)",
    shadowColor = "rgba(76,193,87,0.5)",
    onPhotoClick,
}: {
    photos: string[];
    accentColor?: string;
    shadowColor?: string;
    onPhotoClick: (idx: number) => void;
}) => {
    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[0, 1].map((i) => (
                <Driven key={i} fromY={20} delay={i * 0.1}>
                    <button
                        type="button"
                        onClick={() => onPhotoClick(i)}
                        className="group relative w-full aspect-[4/3] sm:aspect-[16/9] cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 transition-all duration-500 hover:scale-[1.02] hover:border-[var(--hover-border)] hover:shadow-[var(--hover-shadow)] focus-visible:outline-none"
                        style={{
                            ["--hover-border" as string]: accentColor,
                            ["--hover-shadow" as string]: `0 20px 40px -15px ${shadowColor}`,
                        } as CSSProperties}
                    >
                        <MediaItem
                            src={photos[i]}
                            alt={`Dišpet partner ${i + 1}`}
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30" />
                    </button>
                </Driven>
            ))}
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

/** Reveal whose progress is triggered when the element enters the viewport. */
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
    return (
        <motion.div
            className={className}
            style={style}
            initial={{
                opacity: 0,
                y: fromY,
                x: fromX,
                rotate: fromRotate,
                scale: fromScale,
            }}
            whileInView={{
                opacity: 1,
                y: 0,
                x: 0,
                rotate: 0,
                scale: 1,
            }}
            viewport={{ once: true, margin: "-50px 0px -50px 0px" }}
            transition={{
                duration: 0.8,
                delay: delay,
                ease: [0.16, 1, 0.3, 1], // easeOutQuart
            }}
        >
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
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], [dist, -dist]);
    return (
        <motion.div ref={ref} className={className} style={{ ...style, y }}>
            {children}
        </motion.div>
    );
};

/** Counter that counts up when it enters the viewport.
 *  Initial render shows the FINAL value so crawlers and prerendered HTML
 *  always carry the real number. */
const ScrollCount = ({ value, className }: { value: string; className?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px 0px" });
    const match = value.match(/^([\d.,]+)(.*)$/);
    const rawNum = match ? match[1] : "";
    const suffix = match ? match[2] : value;
    const target = match ? parseFloat(rawNum.replace(/\./g, "").replace(",", ".")) : 0;
    const useThousands = rawNum.includes(".");

    const [text, setText] = useState(!match ? value : "0" + suffix);

    useEffect(() => {
        if (!match || !isInView) return;

        const controls = animate(0, target, {
            duration: 1.4,
            ease: "easeOut",
            onUpdate: (v) => {
                const rounded = Math.round(v);
                setText((useThousands ? rounded.toLocaleString("hr-HR") : String(rounded)) + suffix);
            }
        });
        return () => controls.stop();
    }, [isInView, target, match, useThousands, suffix]);

    return (
        <span ref={ref} className={className}>
            {text}
        </span>
    );
};

/** Underline that draws itself in when it enters the viewport. */
const DrivenRule = ({ className = "" }: { className?: string }) => {
    return (
        <div className={`h-1 w-full overflow-hidden ${className}`}>
            <motion.div
                className="mk-rainbow h-full w-full origin-left"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-50px 0px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            />
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
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.3em] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.5)] ${TAG_COLORS[color]}`}
    >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
        {label}
    </span>
);

/** Unified section header — one rhythm for the whole page. */
const SectionHeader = ({
    tag,
    tagColor = "teal",
    title,
    lede,
    rule = false,
    className = "max-w-3xl",
}: {
    tag: string;
    tagColor?: keyof typeof TAG_COLORS;
    title: ReactNode;
    lede?: ReactNode;
    rule?: boolean;
    className?: string;
}) => (
    <Driven fromY={36} className={className}>
        <SectionTag label={tag} color={tagColor} />
        <h2 className="mk-display mt-5 leading-[1.04] text-[clamp(1.9rem,5.5vw,3.25rem)] text-white">
            {title}
        </h2>
        {rule && <DrivenRule className="mt-5 max-w-[120px] rounded-full" />}
        {lede && <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">{lede}</p>}
    </Driven>
);

/** Inline conversion row — reuses the sticky-bar strings. */
const CtaRow = ({ location }: { location: string }) => (
    <Driven fromY={28} className="mt-14 flex items-center gap-5 sm:gap-8">
        <div className="mk-hairline flex-1" />
        <div className="flex flex-col items-center gap-2.5 text-center">
            <a
                href="#kontakt"
                onClick={() => trackEvent("cta_request_offer_click", { location })}
                className="mk-btn-glow inline-flex min-h-11 items-center rounded-full bg-mk-pink px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition"
            >
                Zatraži ponudu
            </a>
            <p className="text-xs text-white/60 sm:text-sm">Kreiramo paket po mjeri — odgovor u 24h.</p>
        </div>
        <div className="mk-hairline flex-1" />
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
    const scaleX = useSpring(pageProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
    return (
        <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-lg" style={{ backgroundColor: "rgba(7,17,35,0.85)" }}>
            {/* Scroll progress bar — the rainbow fills as you read */}
            <div className="h-1 w-full bg-white/5">
                <motion.div className="mk-rainbow h-full w-full origin-left" style={{ scaleX }} />
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
                        <p className="mt-7 max-w-lg text-lg leading-relaxed text-white/80 sm:text-xl">
                            Besplatan dan sporta, edukacije i{" "}
                            <mark className="rounded-[4px] bg-mk-yellow px-1.5 font-bold text-on-bright">zabave za djecu</mark>{" "}
                            — pokret koji pokreće generaciju.
                        </p>
                        <div className="mt-9 flex flex-wrap gap-3">
                            <a
                                href="#kontakt"
                                onClick={() => trackEvent("cta_request_offer_click", { location: "hero" })}
                                className="mk-btn-glow inline-flex min-h-11 items-center rounded-full bg-mk-pink px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition"
                            >
                                Zatraži ponudu
                            </a>
                            <a
                                href="#paketi"
                                onClick={() => trackEvent("hero_cta_packages_click")}
                                className="inline-flex min-h-11 items-center rounded-full border border-white/25 bg-white/[0.03] px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:border-white/50 hover:bg-white/[0.07]"
                            >
                                Pogledaj pakete
                            </a>
                        </div>
                        <div className="mt-12 border-t border-white/10 pt-6">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/65">
                                <span className="mk-teal">Partneri</span>
                                <span>HNK Hajduk</span>
                                <span className="h-1 w-1 rounded-full bg-white/25" />
                                <span>Rocket FA</span>
                                <span className="h-1 w-1 rounded-full bg-white/25" />
                                <span>Automall Split</span>
                                <span className="h-1 w-1 rounded-full bg-white/25" />
                                <span>Splitska Dica</span>
                            </div>
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
                                <div className="mk-display text-3xl leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">SPLIT</div>
                                <div className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-white/80">
                                    Baza pokreta · širimo se u 2026.
                                </div>
                            </div>
                            <div className="rounded-full bg-mk-teal px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-on-bright shadow-[0_6px_18px_-6px_rgba(0,196,196,0.7)]">
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
        <div className="relative overflow-hidden border-y border-white/10 bg-mk-navy py-3.5" aria-hidden="true">
            <motion.div className="flex w-max items-center gap-12 whitespace-nowrap" style={reduce ? undefined : { x }}>
                {row.map((t, i) => (
                    <span key={i} className="flex items-center gap-12">
                        <span className="mk-display text-[13px] uppercase tracking-[0.3em] text-white/35">{t}</span>
                        <span className={`h-1.5 w-1.5 rounded-full opacity-70 ${["bg-mk-pink", "bg-mk-teal", "bg-mk-yellow", "bg-mk-green"][i % 4]}`} />
                    </span>
                ))}
            </motion.div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--mk-navy)] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--mk-navy)] to-transparent" />
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
                            { n: "10.000+", l: "Djece · cilj 2026.", c: "mk-teal", bar: "bg-mk-teal" },
                            { n: "3", l: "Grada · širenje", c: "mk-pink", bar: "bg-mk-pink" },
                            { n: "100K+", l: "Digital reach", c: "mk-yellow", bar: "bg-mk-yellow" },
                        ].map((s, i) => (
                            <Driven key={s.l} fromY={26} delay={i * 0.04} className="min-w-0 px-2 py-8 text-center sm:px-4 md:py-12">
                                <div className={`mk-display leading-[0.95] ${s.c}`} style={{ fontSize: "clamp(1.5rem, 5.5vw, 3.5rem)" }}>
                                    <ScrollCount value={s.n} />
                                </div>
                                <span className={`mx-auto mt-3 block h-1 w-8 rounded-full ${s.bar} opacity-80`} aria-hidden />
                                <div className="mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 sm:text-[11px] sm:tracking-[0.25em]">
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
                            <SectionHeader
                                tag="O nama"
                                tagColor="yellow"
                                rule
                                title={<>ŠTO JE <span className="mk-yellow">DIŠPET?</span></>}
                                className=""
                            />
                            <Driven fromY={36} delay={0.05}>
                                <p className="mt-6 text-base leading-relaxed text-white/80 sm:text-lg">
                                    Dišpet nije događaj — Dišpet je <strong className="text-white">pokret i projekt</strong> koji
                                    spaja <strong className="text-white">zabavu, sport i edukaciju</strong> za djecu predškolske
                                    dobi i nižih razreda osnovne škole.
                                </p>
                                <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
                                    Financira se isključivo od sponzora — za svu djecu uvijek{" "}
                                    <mark className="rounded-[4px] bg-mk-yellow px-1.5 font-bold text-on-bright">BESPLATNO!</mark>
                                </p>
                            </Driven>
                            <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                {[
                                    { l: "Sport", c: "bg-mk-teal text-on-bright" },
                                    { l: "Edukacija", c: "bg-mk-green text-on-bright" },
                                    { l: "Digital", c: "bg-mk-yellow text-on-bright" },
                                    { l: "Kreativa", c: "bg-mk-pink text-white" },
                                ].map((p, i) => (
                                    <Driven key={p.l} fromY={24} fromScale={0.9} delay={i * 0.04}>
                                        <span className={`block rounded-full px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)] ${p.c}`}>
                                            {p.l}
                                        </span>
                                    </Driven>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-7">
                            <AboutCollage
                                photos={SECTION_PHOTOS.onama}
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
                            <SectionHeader
                                tag="Na terenu"
                                tagColor="pink"
                                title={<>DIŠPET <span className="mk-pink">U AKCIJI.</span></>}
                                lede="Svako događanje je puna energija, smijeh i sport. Profesionalni kadar, pravi momenti, stvarni efekt — diljem Dalmacije."
                                className="md:col-span-8"
                            />
                            <Driven fromX={40} fromY={0} delay={0.06} className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/55 md:col-span-4 md:pb-1 md:text-right">
                                Rekreacija · Edukacija · Iskustvo · 2025.
                            </Driven>
                        </div>
                        <div className="mt-10">
                            <TerenCollage
                                photos={SECTION_PHOTOS.teren}
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
                        <SectionHeader
                            tag="Zašto Dišpet"
                            tagColor="pink"
                            rule
                            title={<>ZAŠTO SPONZORI <span className="mk-pink">BIRAJU DIŠPET?</span></>}
                        />
                        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                            {[
                                { t: "Direktan kontakt", d: "S djecom i roditeljima na terenu, oči u oči.", c: "mk-teal", bar: "bg-mk-teal" },
                                { t: "Brend kroz igru", d: "Vaš logo viđen kroz pokret, ne kroz reklamu.", c: "mk-pink", bar: "bg-mk-pink" },
                                { t: "Pozitivne asocijacije", d: "Sport, zabava, zdravlje — vrijednosti koje grade brend.", c: "mk-yellow", bar: "bg-mk-yellow" },
                                { t: "Lokalna zajednica", d: "Split kao baza — širenje na 3 grada u 2026.", c: "mk-green", bar: "bg-mk-green" },
                                { t: "Foto & video", d: "Profesionalna dokumentacija s vašim logom.", c: "mk-teal", bar: "bg-mk-teal" },
                                { t: "100.000+ impressions", d: "Digital reach kroz cijelu sezonu.", c: "mk-pink", bar: "bg-mk-pink" },
                            ].map((b, i) => (
                                <Driven key={b.t} fromY={48} fromScale={0.96} delay={(i % 3) * 0.05}>
                                    <article className="mk-ring-gradient relative h-full overflow-hidden rounded-2xl border border-white/10 bg-mk-card p-6 transition duration-300 hover:-translate-y-1 sm:p-7">
                                        <span className={`absolute left-6 top-0 h-1 w-9 rounded-b-full ${b.bar} sm:left-7`} aria-hidden />
                                        <h3 className={`mk-display pt-1 text-base uppercase tracking-wide ${b.c}`}>{b.t}</h3>
                                        <p className="mt-2.5 text-sm leading-relaxed text-white/70 sm:text-[15px]">{b.d}</p>
                                    </article>
                                </Driven>
                            ))}
                        </div>
                        <CtaRow location="after_zasto" />
                    </div>
                </section>

                {/* PAKETI */}
                <section id="paketi" className="mx-auto max-w-7xl px-5 py-14 sm:py-20 md:py-28">
                    <SectionHeader
                        tag="Sponzorski paketi"
                        tagColor="yellow"
                        title={<>MARKETING <span className="mk-yellow">MOGUĆNOSTI.</span></>}
                        lede="Pet ravnopravnih kanala kroz koje gradimo vašu vidljivost — birajte jedan ili kombinirajte sve u paket po mjeri."
                    />
                    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                        {[
                            { n: "01", t: "Sponzorske površine", d: "150m+ ograde, brendirani paneli i logo na svim materijalima na terenu.", c: "bg-mk-teal" },
                            { n: "02", t: "Digitalna vidljivost", d: "dispet.fun, društvene mreže, foto i video sadržaj te newsletter.", c: "bg-mk-pink" },
                            { n: "03", t: "Aktivacija na terenu", d: "Vlastiti štand, dijeljenje proizvoda i sponzorstvo igara.", c: "bg-mk-yellow" },
                            { n: "04", t: "Reklamni materijali", d: "Majice i oprema s vašim logom, pokloni za djecu, web integracija.", c: "bg-mk-green" },
                            { n: "05", t: "Medijske kampanje", d: "Zajednički PR nastup i koordinirane kampanje na svim kanalima.", c: "bg-mk-pink" },
                        ].map((p, i) => (
                            <Driven key={p.n} fromX={i % 2 ? 40 : -40} fromY={20} delay={(i % 3) * 0.04}>
                                <article className="mk-ring-gradient group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-mk-card p-6 transition duration-300 hover:-translate-y-1 sm:p-7">
                                    <span className="mk-ghost-num" aria-hidden>{p.n}</span>
                                    <div className={`mk-display inline-flex h-11 w-11 items-center justify-center rounded-xl ${p.c} text-lg text-on-bright shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)] transition duration-500 group-hover:rotate-3 group-hover:scale-105`}>
                                        {p.n}
                                    </div>
                                    <h3 className="mk-display mt-5 text-xl text-white">{p.t}</h3>
                                    <p className="mt-2.5 flex-1 text-sm leading-relaxed text-white/70 sm:text-[15px]">{p.d}</p>
                                    <a
                                        href="#kontakt"
                                        onClick={() => pickPackage(p.t, `package_${p.n}`)}
                                        className="relative mt-6 inline-flex items-center gap-1.5 border-t border-white/[0.07] pt-4 text-[11px] font-bold uppercase tracking-[0.18em] mk-pink transition hover:brightness-110"
                                    >
                                        Zatraži ponudu
                                        <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
                                    </a>
                                </article>
                            </Driven>
                        ))}
                        <Driven fromY={32} fromScale={0.96} delay={0.08}>
                            <a
                                href="#kontakt"
                                onClick={() => pickPackage("Paket po mjeri", "packages_custom")}
                                className="group flex h-full min-h-[200px] flex-col justify-between rounded-2xl border border-dashed border-white/25 bg-white/[0.02] p-6 transition hover:border-[var(--mk-pink)] hover:bg-[rgba(247,65,128,0.05)] sm:p-7"
                            >
                                <div>
                                    <div className="mk-display text-xl mk-pink">Paket po mjeri</div>
                                    <p className="mt-2.5 text-sm leading-relaxed text-white/70 sm:text-[15px]">
                                        Kombiniramo sve elemente prema vašim ciljevima i budžetu. Sve je moguće.
                                    </p>
                                </div>
                                <div className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                                    Dogovorite poziv
                                    <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
                                </div>
                            </a>
                        </Driven>
                    </div>
                </section>

                {/* SPONZORSKE POVRŠINE — detail behind package 01 */}
                <section className="mx-auto max-w-7xl px-5 pb-14 sm:pb-20 md:pb-28">
                    <div className="grid gap-12 md:grid-cols-12">
                        <div className="md:col-span-6">
                            <SponsorCollage
                                photos={SECTION_PHOTOS.sponsor}
                                accentColor="var(--mk-teal)"
                                shadowColor="rgba(0,196,196,0.5)"
                                onPhotoClick={(idx) => {
                                    setActiveSection("sponsor");
                                    setSelectedPhotoIdx(idx);
                                }}
                            />
                        </div>
                        <div className="md:col-span-6">
                            <SectionHeader
                                tag="Sponzorske površine"
                                tagColor="teal"
                                title={<>VAŠA REKLAMA <span className="mk-teal">NA TERENU.</span></>}
                                lede="Brendirane površine koje okružuju svako Dišpet događanje. Vaš logo vidljiv kroz sport, igru i pokret — a ne kroz reklamu."
                                className=""
                            />
                            <div className="mt-9 grid grid-cols-3 gap-2.5 sm:gap-4">
                                {[
                                    { n: "150m+", l: "Sponzorske površine" },
                                    { n: "Teren", l: "+ ograda i okolica" },
                                    { n: "Sve", l: "Lokacije u gradu" },
                                ].map((s, i) => (
                                    <Driven key={s.l} fromY={32} fromScale={0.94} delay={0.06 + i * 0.05}>
                                        <div className="min-w-0 rounded-xl border border-white/10 bg-mk-card p-3.5 transition duration-300 hover:border-[rgba(249,198,53,0.45)] sm:p-5">
                                            <div className="mk-display leading-none mk-yellow" style={{ fontSize: "clamp(1.05rem, 3.2vw, 1.55rem)" }}>
                                                {/^[\d.,]/.test(s.n) ? <ScrollCount value={s.n} /> : s.n}
                                            </div>
                                            <span className="mt-2.5 block h-0.5 w-6 rounded-full bg-mk-yellow opacity-70" aria-hidden />
                                            <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60 sm:text-[11px]">
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
                        <SectionHeader
                            tag="Online ekosustav"
                            tagColor="teal"
                            title={<>DISPET.<span className="mk-teal">FUN</span></>}
                            lede="Više od web stranice — kompletan digitalni ekosustav koji radi za vas 24/7."
                        />

                        <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
                            {[
                                { n: "2.000+", l: "Članova Kluba", c: "mk-pink", bar: "bg-mk-pink" },
                                { n: "100K+", l: "Digital reach godišnje", c: "mk-teal", bar: "bg-mk-teal" },
                                { n: "24/7", l: "Vidljivost vašeg loga", c: "mk-yellow", bar: "bg-mk-yellow" },
                            ].map((s, i) => (
                                <Driven key={s.l} fromY={36} delay={i * 0.05}>
                                    <div className="min-w-0 rounded-2xl border border-white/10 bg-mk-card p-3.5 transition duration-300 hover:border-white/25 sm:p-5">
                                        <div className={`mk-display leading-none ${s.c}`} style={{ fontSize: "clamp(1.25rem, 4.5vw, 1.875rem)" }}>
                                            {/^[\d.,]/.test(s.n) ? <ScrollCount value={s.n} /> : s.n}
                                        </div>
                                        <span className={`mt-2.5 block h-0.5 w-6 rounded-full ${s.bar} opacity-70`} aria-hidden />
                                        <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60 sm:text-[11px]">
                                            {s.l}
                                        </div>
                                    </div>
                                </Driven>
                            ))}
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                            {[
                                { t: "Web trgovina", d: "Majice, hoodiesi, kape, termosice — s opcijom sponzorskog loga.", c: "border-t-[var(--mk-teal)]", icon: "🛍️", href: "https://dispet.fun/shop" },
                                { t: "Dječji kutak", d: "AI treninzi, igre za mozak i edukativni sadržaj za djecu.", c: "border-t-[var(--mk-yellow)]", icon: "🧠", href: "/games" },
                                { t: "Dišpet Klub", d: "Membership, popusti i merch drops — 2.000+ članova.", c: "border-t-[var(--mk-pink)]", icon: "💛", href: null },
                                { t: "Blog & novosti", d: "Eventi i profesionalni sadržaj — istaknuto partnerstvo.", c: "border-t-[var(--mk-green)]", icon: "📰", href: "/blog" },
                            ].map((c, i) => (
                                <Driven key={c.t} fromY={44} fromScale={0.96} delay={(i % 4) * 0.045}>
                                    <div className={`h-full rounded-2xl border border-white/10 border-t-4 ${c.c} bg-mk-card p-6 transition duration-500 hover:-translate-y-1`}>
                                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.06] text-xl ring-1 ring-white/10" aria-hidden>{c.icon}</div>
                                        <h3 className="mk-display mt-4 text-lg text-white">
                                            {c.href ? (
                                                <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel={c.href.startsWith("http") ? "noreferrer" : undefined} className="hover:underline">
                                                    {c.t}
                                                </a>
                                            ) : c.t}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-white/70">{c.d}</p>
                                    </div>
                                </Driven>
                            ))}
                        </div>

                        <Driven fromY={36}>
                            <div className="mt-5 rounded-2xl border border-white/10 bg-mk-card p-6 sm:p-8">
                                <div className="mk-display text-base uppercase tracking-wide text-white/90 sm:text-xl">
                                    Zašto digitalno znači više za vas?
                                </div>
                                <div className="mk-hairline mt-4" />
                                <ul className="mt-5 grid gap-3.5 sm:grid-cols-2 sm:gap-4">
                                    {[
                                        "Logo vidljiv na svim stranicama i u web shopu",
                                        "Istaknuto partnerstvo u blog postovima i newsletteru",
                                        "Ekskluzivne akcije za Dišpet Klub članove u vaše ime",
                                        "100.000+ digital impressions godišnje",
                                    ].map((b) => (
                                        <li key={b} className="flex items-start gap-3">
                                            <span className="mt-[7px] inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mk-pink" />
                                            <span className="text-sm leading-relaxed text-white/80 sm:text-[15px]">{b}</span>
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
                            <SectionHeader
                                tag="Ciljevi 2026."
                                tagColor="teal"
                                title={<>KAMO <span className="mk-teal">IDEMO.</span></>}
                                lede="Jasni, mjerljivi ciljevi za iduću sezonu — i mjesto za vaš brend u svakoj brojci."
                                className="md:col-span-5"
                            />
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
                                <SectionHeader
                                    tag="Zajednica"
                                    tagColor="teal"
                                    title={<>NAŠI <span className="mk-teal">PARTNERI.</span></>}
                                    lede="Partneri koji dijele jednu viziju — aktivna i educirana djeca Hrvatske."
                                    className=""
                                />
                                <Driven fromY={40} delay={0.05} className="mt-7 overflow-hidden rounded-2xl ring-1 ring-white/10">
                                    <Parallax dist={20}>
                                        <MediaItem src={allImages[20] || allImages[0]} alt="Dišpet partneri" className="aspect-[4/3] w-full scale-110 object-cover" />
                                    </Parallax>
                                </Driven>
                            </div>
                            <div className="md:col-span-7">
                                <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
                                    {[
                                        { t: "HNK Hajduk", d: "Dječja tribina Poljud + Hajduk Fan Shop aktivacija.", c: "mk-pink", bar: "bg-mk-pink" },
                                        { t: "Rocket Football Academy", d: "Partnerstvo s akademijom Ivana Rakitića.", c: "mk-teal", bar: "bg-mk-teal" },
                                        { t: "Automall Split", d: "Strateški partner — 400+ djece u autosalonu.", c: "mk-yellow", bar: "bg-mk-yellow" },
                                        { t: "Splitska Dica", d: "Zajednički festival Split za djecu — sport, igra i edukacija.", c: "mk-green", bar: "bg-mk-green" },
                                    ].map((p, i) => (
                                        <Driven key={p.t} fromX={i % 2 ? 36 : -36} fromY={16} delay={(i % 2) * 0.05}>
                                            <article className="mk-ring-gradient relative h-full overflow-hidden rounded-2xl border border-white/10 bg-mk-card p-6 transition duration-500 hover:-translate-y-1 hover:border-white/25">
                                                <span className={`absolute left-6 top-0 h-1 w-9 rounded-b-full ${p.bar}`} aria-hidden />
                                                <h3 className={`mk-display pt-1 text-lg ${p.c}`}>{p.t}</h3>
                                                <p className="mt-2 text-sm leading-relaxed text-white/70">{p.d}</p>
                                            </article>
                                        </Driven>
                                    ))}
                                </div>
                                <div className="mt-6">
                                    <PartneriCollage
                                        photos={SECTION_PHOTOS.partneri}
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
