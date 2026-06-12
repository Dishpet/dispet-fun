/**
 * Marketing Ponuda v2 — shared content, data and animation primitives.
 *
 * Everything the page says lives here (single source of truth);
 * everything the page *does* visually is built from the primitives below.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
    motion,
    AnimatePresence,
    animate,
    useInView,
    useScroll,
    useTransform,
    type MotionValue,
} from "framer-motion";

/* ================================================================== */
/*  Analytics + links                                                  */
/* ================================================================== */

export const trackEvent = (name: string, params?: Record<string, unknown>) => {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", name, params || {});
};

/** Deep links into the shop configurator (see docs/MARKETING_URLS.md) */
export const shopUrl = (id: string) => `https://dispet.fun/shop?product=${id}&mode=customizing`;

/* ================================================================== */
/*  Assets                                                             */
/* ================================================================== */

const A = (name: string) => `/marketing/${name}`;
export const IMG = {
    hero: A("hero.jpg"),
    logo: A("dispet-logo-official.png"),
    mascotWave: A("dispet-mascot-wave.gif"),
    mascotDance: A("dispet-mascot-dance.gif"),
};

const galleryImagesMap = import.meta.glob("@/assets/gallery/dispet galerija (*).webp", { eager: true, import: "default" });
const galleryVideosMap = import.meta.glob(["@/assets/gallery/*.webm", "@/assets/gallery/*.mp4"], { eager: true, import: "default" });

export const allImages = Object.values(galleryImagesMap) as string[];
export const allVideos = Object.values(galleryVideosMap) as string[];

/** Section media for collages + lightbox, grouped by section */
export const SECTION_PHOTOS = {
    onama: [allVideos[0] || allImages[0], allImages[1], allImages[2], allImages[3], allImages[4], allImages[5]],
    teren: [allImages[6], allVideos[1] || allImages[7], allImages[8], allImages[9], allImages[10], allImages[11]],
    sponsor: [allVideos[2] || allImages[12], allImages[13], allImages[14]],
    partneri: [allImages[15], allImages[16], allVideos[3] || allImages[17], allImages[18]],
};

export const isVideoSrc = (src: string) => src.endsWith(".webm") || src.endsWith(".mp4");

/** Renders either a looping muted video or a lazy image — same API. */
export const MediaItem = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    if (isVideoSrc(src)) {
        return <video src={src} autoPlay loop muted playsInline className={className} />;
    }
    return <img src={src} alt={alt} loading="lazy" className={className} />;
};

/* ================================================================== */
/*  Page copy — facts only, nothing invented                           */
/* ================================================================== */

export const FAQ_ITEMS = [
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

export const SCHEMA_GRAPH = {
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
                { "@type": "Offer", name: "Sponzorske površine", description: "150 m+ ograde i panela uz teren — logo na svim materijalima." },
                { "@type": "Offer", name: "Digitalna vidljivost", description: "dispet.fun, društvene mreže, foto/video sadržaj i newsletter." },
                { "@type": "Offer", name: "Aktivacija na terenu", description: "Vlastiti štand, dijeljenje proizvoda i sponzorstvo igara." },
                { "@type": "Offer", name: "Reklamni materijali", description: "Oprema s vašim logom, pokloni za djecu, web integracija." },
                { "@type": "Offer", name: "Medijske kampanje", description: "Zajednički PR nastup i koordinirane kampanje." },
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

/* ================================================================== */
/*  Animation primitives                                               */
/*                                                                     */
/*  Mobile-robust by design:                                           */
/*  - entrance reveals use whileInView with `amount` thresholds        */
/*    (no negative px margins — those misbehave with dynamic mobile    */
/*    URL-bar viewports)                                               */
/*  - no useReducedMotion anywhere: animations play for everyone       */
/* ================================================================== */

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface RevealProps {
    children: ReactNode;
    className?: string;
    fromY?: number;
    fromX?: number;
    fromRotate?: number;
    fromScale?: number;
    delay?: number;
    style?: CSSProperties;
}

/** One-shot entrance reveal when the element scrolls into view. */
export const Reveal = ({
    children,
    className,
    fromY = 44,
    fromX = 0,
    fromRotate = 0,
    fromScale = 1,
    delay = 0,
    style,
}: RevealProps) => (
    <motion.div
        className={className}
        style={style}
        initial={{ opacity: 0, y: fromY, x: fromX, rotate: fromRotate, scale: fromScale }}
        whileInView={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, delay, ease: EASE_OUT }}
    >
        {children}
    </motion.div>
);

/** Continuous parallax drift while the element crosses the viewport. */
export const Parallax = ({
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

/**
 * Count-up number. Runs exactly once when it enters the viewport.
 *
 * The parse result is memoized and the animation is guarded by a ref,
 * so parent re-renders can never restart it (the bug that made the
 * old counters flicker back to zero).
 */
export const Counter = ({ value, className }: { value: string; className?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, amount: 0.6 });
    const started = useRef(false);

    const parsed = useMemo(() => {
        const m = value.match(/^([\d.,]+)(.*)$/);
        if (!m) return null;
        return {
            target: parseFloat(m[1].replace(/\./g, "").replace(",", ".")),
            suffix: m[2],
            thousands: m[1].includes("."),
        };
    }, [value]);

    const [text, setText] = useState(() => (parsed ? "0" + parsed.suffix : value));

    useEffect(() => {
        if (!inView || !parsed || started.current) return;
        started.current = true;
        const controls = animate(0, parsed.target, {
            duration: 1.4,
            ease: "easeOut",
            onUpdate: (v) => {
                const n = Math.round(v);
                setText((parsed.thousands ? n.toLocaleString("hr-HR") : String(n)) + parsed.suffix);
            },
        });
        return () => controls.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, guarded by `started`
    }, [inView]);

    return (
        <span ref={ref} className={className}>
            {text}
        </span>
    );
};

/** Rainbow underline that draws itself in on first view. */
export const RainbowRule = ({ className = "" }: { className?: string }) => (
    <div className={`h-1 w-full overflow-hidden ${className}`}>
        <motion.div
            className="mk-rainbow h-full w-full origin-left"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        />
    </div>
);

/* ================================================================== */
/*  Shared UI                                                          */
/* ================================================================== */

export const TAG_COLORS = {
    teal: "bg-mk-teal text-on-bright",
    pink: "bg-mk-pink text-white",
    yellow: "bg-mk-yellow text-on-bright",
    green: "bg-mk-green text-on-bright",
} as const;

export const SectionTag = ({ label, color = "teal" }: { label: string; color?: keyof typeof TAG_COLORS }) => (
    <span
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.3em] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.5)] ${TAG_COLORS[color]}`}
    >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
        {label}
    </span>
);

/** Unified section header — one rhythm for the whole page. */
export const SectionHeader = ({
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
    <Reveal fromY={36} className={className}>
        <SectionTag label={tag} color={tagColor} />
        <h2 className="mk-display mt-5 leading-[1.04] text-[clamp(1.9rem,5.5vw,3.25rem)] text-white">{title}</h2>
        {rule && <RainbowRule className="mt-5 max-w-[120px] rounded-full" />}
        {lede && <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">{lede}</p>}
    </Reveal>
);

/** Inline conversion row — mirrors the sticky-bar promise. */
export const CtaRow = ({ location }: { location: string }) => (
    <Reveal fromY={28} className="mt-14 flex items-center gap-5 sm:gap-8">
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
    </Reveal>
);

/* ================================================================== */
/*  Lightbox                                                           */
/* ================================================================== */

export const GalleryLightbox = ({
    photos,
    selected,
    setSelected,
}: {
    photos: string[];
    selected: number | null;
    setSelected: (v: number | null) => void;
}) => {
    const next = useCallback(
        () => setSelected(selected === null ? null : (selected + 1) % photos.length),
        [selected, photos.length, setSelected],
    );
    const prev = useCallback(
        () => setSelected(selected === null ? null : (selected - 1 + photos.length) % photos.length),
        [selected, photos.length, setSelected],
    );

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

    const navBtn =
        "fixed z-[120] flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50";

    return (
        <AnimatePresence>
            {selected !== null && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-2 backdrop-blur-sm md:p-8"
                    onClick={() => setSelected(null)}
                >
                    <button type="button" aria-label="Zatvori" className={`${navBtn} right-4 top-4`} onClick={(e) => { e.stopPropagation(); setSelected(null); }}>
                        <X className="h-6 w-6" />
                    </button>
                    <button type="button" aria-label="Prethodna" className={`${navBtn} left-2 top-1/2 -translate-y-1/2 md:left-8`} onClick={(e) => { e.stopPropagation(); prev(); }}>
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button type="button" aria-label="Sljedeća" className={`${navBtn} right-2 top-1/2 -translate-y-1/2 md:right-8`} onClick={(e) => { e.stopPropagation(); next(); }}>
                        <ChevronRight className="h-6 w-6" />
                    </button>
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex h-full w-full flex-col items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isVideoSrc(photos[selected]) ? (
                            <video src={photos[selected]} autoPlay loop muted playsInline controls className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl" />
                        ) : (
                            <img src={photos[selected]} alt="Dišpet fotografija" className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl" />
                        )}
                        <div className="mt-4 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md">
                            {selected + 1} / {photos.length}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/* ================================================================== */
/*  Partner marquee — slides horizontally as the page scrolls          */
/* ================================================================== */

export const Marquee = ({ pageProgress }: { pageProgress: MotionValue<number> }) => {
    const x = useTransform(pageProgress, [0, 1], ["2%", "-42%"]);
    const items = ["HNK Hajduk", "Rocket Football Academy", "Automall Split", "Splitska Dica", "dispet.fun", "10.000+ djece"];
    const row = [...items, ...items, ...items];
    return (
        <div className="relative overflow-hidden border-y border-white/10 bg-mk-navy py-3.5" aria-hidden="true">
            <motion.div className="flex w-max items-center gap-12 whitespace-nowrap" style={{ x }}>
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
