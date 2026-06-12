/**
 * Marketing Ponuda v2 — clean rewrite of /marketing-ponuda.
 *
 * Same look, same content, untangled code:
 *  - shared.tsx     content, data, animation primitives
 *  - collages.tsx   editorial photo layouts
 *  - MerchStage.tsx pinned 3D show + gallery underlay
 *  - this file      nav, hero, sections, form, footer
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, type MotionValue } from "framer-motion";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { SEOHead } from "@/components/SEOHead";
import {
    IMG,
    FAQ_ITEMS,
    SCHEMA_GRAPH,
    SECTION_PHOTOS,
    allImages,
    trackEvent,
    Reveal,
    Parallax,
    Counter,
    SectionTag,
    SectionHeader,
    CtaRow,
    GalleryLightbox,
    Marquee,
    MediaItem,
} from "./shared";
import { AboutCollage, TerenCollage, SponsorCollage, PartneriCollage } from "./collages";
import { MerchStage } from "./MerchStage";
import "../marketing-ponuda.css";

/* ================================================================== */
/*  Navigation                                                         */
/* ================================================================== */

const NAV_LINKS = [
    { href: "#o-nama", label: "O nama" },
    { href: "#zasto", label: "Zašto" },
    { href: "#paketi", label: "Paketi" },
    { href: "#partneri", label: "Partneri" },
    { href: "#merch", label: "Merch" },
];

const Nav = ({ pageProgress }: { pageProgress: MotionValue<number> }) => {
    const [open, setOpen] = useState(false);
    const scaleX = useSpring(pageProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
    return (
        <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-lg" style={{ backgroundColor: "rgba(7,17,35,0.85)" }}>
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
                            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-white/5 py-3 text-sm font-medium text-white/85">
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

/* ================================================================== */
/*  Sticky CTA bar                                                     */
/* ================================================================== */

const StickyCTA = ({ pageProgress }: { pageProgress: MotionValue<number> }) => {
    const [dismissed, setDismissed] = useState(false);
    const [active, setActive] = useState(false);
    const [formInView, setFormInView] = useState(false);
    const y = useTransform(pageProgress, [0.05, 0.1], [110, 0]);
    const opacity = useTransform(pageProgress, [0.05, 0.1], [0, 1]);
    useMotionValueEvent(pageProgress, "change", (p) => setActive(p > 0.07));

    // The bar duplicates the form CTA — hide it while the form is visible
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
            style={{ y, opacity: shown ? opacity : 0, paddingBottom: "env(safe-area-inset-bottom)" }}
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

/* ================================================================== */
/*  Hero — animates OUT as you scroll (scrubbed both directions)       */
/* ================================================================== */

const Hero = () => {
    const ref = useRef<HTMLElement>(null);
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

    return (
        <section id="top" ref={ref} className="relative overflow-hidden">
            <motion.div className="mk-grid-dots absolute inset-0 opacity-50" style={{ y: dotsY }} />
            <div className="mk-noise pointer-events-none absolute inset-0 opacity-[0.07]" />
            <motion.div
                className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
                style={{ background: "radial-gradient(circle, var(--mk-pink), transparent 60%)", y: blobPinkY }}
            />
            <motion.div
                className="absolute -right-32 bottom-0 h-[480px] w-[480px] rounded-full opacity-25 blur-3xl"
                style={{ background: "radial-gradient(circle, var(--mk-teal), transparent 60%)", y: blobTealY }}
            />
            <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-14 md:grid-cols-12 md:gap-10 md:py-24">
                <div className="md:col-span-7 md:pt-8">
                    <motion.div style={{ opacity: titleOpacity }}>
                        <SectionTag label="Marketing ponuda · 2026" color="teal" />
                        <h1 className="mk-display mt-6 text-[clamp(2.25rem,8vw,5.75rem)] leading-[0.95] text-white">
                            <motion.span className="block" style={{ x: line1X }}>POKRET KOJI</motion.span>
                            <motion.span className="mk-gradient-pink block" style={{ x: line2X }}>POKREĆE.</motion.span>
                        </h1>
                    </motion.div>
                    <motion.div style={{ y: introY, opacity: titleOpacity }}>
                        <p className="mt-7 max-w-lg text-lg leading-relaxed text-white/80 sm:text-xl">
                            Besplatan dan sporta, edukacije i{" "}
                            <mark className="rounded-[4px] bg-mk-yellow px-1.5 font-bold text-on-bright">zabave za djecu</mark>{" "}
                            — financiran isključivo od sponzora. Vaš brend može pokretati generaciju.
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
                                <span className="mk-teal">Uz nas već stoje:</span>
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
                        style={{ y: imgY, scale: imgScale }}
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
                        style={{ rotate: mascotRotate, y: mascotY }}
                    />
                </div>
            </div>
        </section>
    );
};

/* ================================================================== */
/*  Contact form — posts to the existing /api/contact endpoint         */
/* ================================================================== */

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

const ContactForm = ({ preselected = "" }: { preselected?: string }) => {
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
            // /api/contact takes name/email/phone/message — company and
            // package ride along inside the message body.
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

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

const ZASTO_CARDS = [
    { t: "Oči u oči", d: "Direktan kontakt s djecom i roditeljima na svakom događanju.", c: "mk-teal", bar: "bg-mk-teal" },
    { t: "Brend kroz igru", d: "Logo koji se gleda s osmijehom — ne preskače se.", c: "mk-pink", bar: "bg-mk-pink" },
    { t: "Prave vrijednosti", d: "Sport, zdravlje i zabava — uz to želite stajati.", c: "mk-yellow", bar: "bg-mk-yellow" },
    { t: "Lokalna zajednica", d: "Split je baza — 2026. širimo se na 3 grada.", c: "mk-green", bar: "bg-mk-green" },
    { t: "Foto & video", d: "Profesionalna dokumentacija — vaš logo u svakom kadru.", c: "mk-teal", bar: "bg-mk-teal" },
    { t: "Digital 24/7", d: "100K+ pregleda godišnje na dispet.fun, mrežama i newsletteru.", c: "mk-pink", bar: "bg-mk-pink" },
];

const PACKAGE_CARDS = [
    { n: "01", t: "Sponzorske površine", d: "150 m+ ograde i panela uz teren — logo na svim materijalima.", c: "bg-mk-teal" },
    { n: "02", t: "Digitalna vidljivost", d: "dispet.fun, društvene mreže, foto/video sadržaj i newsletter.", c: "bg-mk-pink" },
    { n: "03", t: "Aktivacija na terenu", d: "Vlastiti štand, dijeljenje proizvoda i sponzorstvo igara.", c: "bg-mk-yellow" },
    { n: "04", t: "Reklamni materijali", d: "Oprema s vašim logom, pokloni za djecu, web integracija.", c: "bg-mk-green" },
    { n: "05", t: "Medijske kampanje", d: "Zajednički PR nastup i koordinirane kampanje.", c: "bg-mk-pink" },
];

const PARTNER_CARDS = [
    { t: "HNK Hajduk", d: "Dječja tribina Poljud + Fan Shop aktivacija.", c: "mk-pink", bar: "bg-mk-pink" },
    { t: "Rocket Football Academy", d: "Partnerstvo s akademijom Ivana Rakitića.", c: "mk-teal", bar: "bg-mk-teal" },
    { t: "Automall Split", d: "Strateški partner — 400+ djece u autosalonu.", c: "mk-yellow", bar: "bg-mk-yellow" },
    { t: "Splitska Dica", d: "Zajednički festival „Split za djecu“.", c: "mk-green", bar: "bg-mk-green" },
];

const STAT_CARDS = [
    { n: "10.000+", l: "Djece na terenu · cilj 2026.", c: "mk-teal", bar: "bg-mk-teal" },
    { n: "3", l: "Grada · Split je baza", c: "mk-pink", bar: "bg-mk-pink" },
    { n: "100K+", l: "Digitalnih pregleda godišnje", c: "mk-yellow", bar: "bg-mk-yellow" },
];

const MarketingPonuda2 = () => {
    const { scrollYProgress: pageProgress } = useScroll();
    const [preselectedPackage, setPreselectedPackage] = useState("");
    const [lightboxSection, setLightboxSection] = useState<keyof typeof SECTION_PHOTOS | null>(null);
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

    const openSectionPhoto = (section: keyof typeof SECTION_PHOTOS) => (idx: number) => {
        setLightboxSection(section);
        setLightboxIdx(idx);
    };

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

                {/* 1 · ŠTO JE DIŠPET — identitet, brojke i dokaz s terena */}
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
                            <Reveal fromY={36} delay={0.05}>
                                <p className="mt-6 text-base leading-relaxed text-white/80 sm:text-lg">
                                    Pokret koji spaja <strong className="text-white">sport, edukaciju i igru</strong> za
                                    predškolce i niže razrede osnovne škole — za svu djecu uvijek{" "}
                                    <mark className="rounded-[4px] bg-mk-yellow px-1.5 font-bold text-on-bright">BESPLATNO!</mark>
                                </p>
                                <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
                                    Račun pokrivaju sponzori. Svaki logo na terenu znači još jedno dijete u igri —{" "}
                                    <strong className="text-white">vaš brend kroz igru, a ne kroz reklamu.</strong>
                                </p>
                            </Reveal>
                            <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                {[
                                    { l: "Sport", c: "bg-mk-teal text-on-bright" },
                                    { l: "Edukacija", c: "bg-mk-green text-on-bright" },
                                    { l: "Digital", c: "bg-mk-yellow text-on-bright" },
                                    { l: "Kreativa", c: "bg-mk-pink text-white" },
                                ].map((p, i) => (
                                    <Reveal key={p.l} fromY={24} fromScale={0.9} delay={i * 0.04}>
                                        <span className={`block rounded-full px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)] ${p.c}`}>
                                            {p.l}
                                        </span>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-7">
                            <AboutCollage
                                photos={SECTION_PHOTOS.onama}
                                accentColor="var(--mk-yellow)"
                                shadowColor="rgba(249,198,53,0.5)"
                                onPhotoClick={openSectionPhoto("onama")}
                            />
                        </div>
                    </div>

                    {/* Brojke — cilj 2026. */}
                    <Reveal fromY={32} className="mt-14">
                        <div className="grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-mk-card">
                            {STAT_CARDS.map((s) => (
                                <div key={s.l} className="min-w-0 px-2 py-7 text-center sm:px-4 md:py-10">
                                    <div className={`mk-display leading-[0.95] ${s.c}`} style={{ fontSize: "clamp(1.4rem, 5vw, 3.25rem)" }}>
                                        <Counter value={s.n} />
                                    </div>
                                    <span className={`mx-auto mt-3 block h-1 w-8 rounded-full ${s.bar} opacity-80`} aria-hidden />
                                    <div className="mt-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/60 sm:text-[11px] sm:tracking-[0.22em]">
                                        {s.l}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Reveal>

                    {/* Dokaz s terena */}
                    <div className="mt-14">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <Reveal fromX={-32} fromY={0}>
                                <h3 className="mk-display text-2xl text-white sm:text-3xl">
                                    DIŠPET <span className="mk-pink">U AKCIJI.</span>
                                </h3>
                            </Reveal>
                            <Reveal fromX={32} fromY={0} delay={0.05} className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/55">
                                Rekreacija · Edukacija · Iskustvo · 2025. · diljem Dalmacije
                            </Reveal>
                        </div>
                        <div className="mt-6">
                            <TerenCollage
                                photos={SECTION_PHOTOS.teren}
                                accentColor="var(--mk-pink)"
                                shadowColor="rgba(247,65,128,0.5)"
                                onPhotoClick={openSectionPhoto("teren")}
                            />
                        </div>
                    </div>
                </section>

                <Marquee pageProgress={pageProgress} />

                {/* 2 · ZAŠTO DIŠPET — vrijednost uživo + digitalni doseg */}
                <section id="zasto" className="bg-mk-navy py-14 sm:py-20 md:py-28">
                    <div className="mx-auto max-w-7xl px-5">
                        <SectionHeader
                            tag="Zašto Dišpet"
                            tagColor="pink"
                            rule
                            title={<>ŠEST RAZLOGA <span className="mk-pink">ZA DA.</span></>}
                            lede="Stvarni kontakt uživo i vidljivost koja radi 24/7 — sve što sponzorstvo treba, na jednom mjestu."
                        />
                        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                            {ZASTO_CARDS.map((b, i) => (
                                <Reveal key={b.t} fromY={48} fromScale={0.96} delay={(i % 3) * 0.05}>
                                    <article className="mk-ring-gradient relative h-full overflow-hidden rounded-2xl border border-white/10 bg-mk-card p-6 transition duration-300 hover:-translate-y-1 sm:p-7">
                                        <span className={`absolute left-6 top-0 h-1 w-9 rounded-b-full ${b.bar} sm:left-7`} aria-hidden />
                                        <h3 className={`mk-display pt-1 text-base uppercase tracking-wide ${b.c}`}>{b.t}</h3>
                                        <p className="mt-2.5 text-sm leading-relaxed text-white/70 sm:text-[15px]">{b.d}</p>
                                    </article>
                                </Reveal>
                            ))}
                        </div>

                        {/* dispet.fun ekosustav — sažeto */}
                        <Reveal fromY={32}>
                            <div className="mt-5 rounded-2xl border border-white/10 bg-mk-card p-6 sm:p-7">
                                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                                    <div className="mk-display text-base uppercase tracking-wide text-white sm:text-lg">
                                        DISPET.<span className="mk-teal">FUN</span> ekosustav
                                    </div>
                                    <p className="text-xs text-white/60 sm:text-sm">
                                        Vaš logo na svim stranicama i u shopu · ekskluzivne akcije za članove u vaše ime
                                    </p>
                                </div>
                                <div className="mk-hairline mt-4" />
                                <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2.5 text-sm text-white/80 sm:text-[15px]">
                                    <a href="https://dispet.fun/shop" target="_blank" rel="noreferrer" className="hover:underline">🛍️ Web trgovina</a>
                                    <a href="/games" className="hover:underline">🧠 Dječji kutak</a>
                                    <span>💛 Dišpet Klub — 2.000+ članova</span>
                                    <a href="/blog" className="hover:underline">📰 Blog & newsletter</a>
                                </div>
                            </div>
                        </Reveal>
                        <CtaRow location="after_zasto" />
                    </div>
                </section>

                {/* 3 · PAKETI — ponuda + površine na terenu */}
                <section id="paketi" className="mx-auto max-w-7xl px-5 py-14 sm:py-20 md:py-28">
                    <SectionHeader
                        tag="Sponzorski paketi"
                        tagColor="yellow"
                        title={<>PET KANALA <span className="mk-yellow">VIDLJIVOSTI.</span></>}
                        lede="Birajte jedan ili složimo paket po mjeri — odgovor u 24 h, bez obaveze."
                    />
                    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                        {PACKAGE_CARDS.map((p, i) => (
                            <Reveal key={p.n} fromX={i % 2 ? 40 : -40} fromY={20} delay={(i % 3) * 0.04}>
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
                            </Reveal>
                        ))}
                        <Reveal fromY={32} fromScale={0.96} delay={0.08}>
                            <a
                                href="#kontakt"
                                onClick={() => pickPackage("Paket po mjeri", "packages_custom")}
                                className="group flex h-full min-h-[200px] flex-col justify-between rounded-2xl border border-dashed border-white/25 bg-white/[0.02] p-6 transition hover:border-[var(--mk-pink)] hover:bg-[rgba(247,65,128,0.05)] sm:p-7"
                            >
                                <div>
                                    <div className="mk-display text-xl mk-pink">Paket po mjeri</div>
                                    <p className="mt-2.5 text-sm leading-relaxed text-white/70 sm:text-[15px]">
                                        Kombiniramo sve prema vašim ciljevima i budžetu. Sve je moguće.
                                    </p>
                                </div>
                                <div className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                                    Dogovorite poziv
                                    <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
                                </div>
                            </a>
                        </Reveal>
                    </div>

                    {/* Površine uživo */}
                    <div className="mt-14 grid gap-10 md:grid-cols-12 md:items-center">
                        <div className="md:col-span-6">
                            <SponsorCollage
                                photos={SECTION_PHOTOS.sponsor}
                                accentColor="var(--mk-teal)"
                                shadowColor="rgba(0,196,196,0.5)"
                                onPhotoClick={openSectionPhoto("sponsor")}
                            />
                        </div>
                        <div className="md:col-span-6">
                            <Reveal fromX={40} fromY={0}>
                                <h3 className="mk-display text-2xl text-white sm:text-3xl">
                                    OVAKO TO <span className="mk-teal">IZGLEDA.</span>
                                </h3>
                                <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
                                    Brendirane površine okružuju svako događanje — teren, ograda i okolica, na svim
                                    lokacijama u gradu.
                                </p>
                            </Reveal>
                            <div className="mt-7 grid grid-cols-3 gap-2.5 sm:gap-4">
                                {[
                                    { n: "150m+", l: "Sponzorskih površina" },
                                    { n: "Teren", l: "+ ograda i okolica" },
                                    { n: "Sve", l: "Lokacije u gradu" },
                                ].map((s, i) => (
                                    <Reveal key={s.l} fromY={28} fromScale={0.94} delay={0.05 + i * 0.05}>
                                        <div className="min-w-0 rounded-xl border border-white/10 bg-mk-card p-3.5 transition duration-300 hover:border-[rgba(249,198,53,0.45)] sm:p-5">
                                            <div className="mk-display leading-none mk-yellow" style={{ fontSize: "clamp(1.05rem, 3.2vw, 1.55rem)" }}>
                                                {/^[\d.,]/.test(s.n) ? <Counter value={s.n} /> : s.n}
                                            </div>
                                            <span className="mt-2.5 block h-0.5 w-6 rounded-full bg-mk-yellow opacity-70" aria-hidden />
                                            <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60 sm:text-[11px]">
                                                {s.l}
                                            </div>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4 · PARTNERI — dokaz neposredno prije forme */}
                <section id="partneri" className="bg-mk-navy py-14 sm:py-20 md:py-28">
                    <div className="mx-auto max-w-7xl px-5">
                        <div className="grid gap-10 md:grid-cols-12">
                            <div className="md:col-span-5">
                                <SectionHeader
                                    tag="Zajednica"
                                    tagColor="teal"
                                    title={<>VEĆ VJERUJU <span className="mk-teal">DIŠPETU.</span></>}
                                    lede="Partneri koji dijele istu viziju — aktivna i educirana djeca."
                                    className=""
                                />
                                <Reveal fromY={40} delay={0.05} className="mt-7 overflow-hidden rounded-2xl ring-1 ring-white/10">
                                    <Parallax dist={20}>
                                        <MediaItem src={allImages[20] || allImages[0]} alt="Dišpet partneri" className="aspect-[4/3] w-full scale-110 object-cover" />
                                    </Parallax>
                                </Reveal>
                            </div>
                            <div className="md:col-span-7">
                                <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
                                    {PARTNER_CARDS.map((p, i) => (
                                        <Reveal key={p.t} fromX={i % 2 ? 36 : -36} fromY={16} delay={(i % 2) * 0.05}>
                                            <article className="mk-ring-gradient relative h-full overflow-hidden rounded-2xl border border-white/10 bg-mk-card p-6 transition duration-500 hover:-translate-y-1 hover:border-white/25">
                                                <span className={`absolute left-6 top-0 h-1 w-9 rounded-b-full ${p.bar}`} aria-hidden />
                                                <h3 className={`mk-display pt-1 text-lg ${p.c}`}>{p.t}</h3>
                                                <p className="mt-2 text-sm leading-relaxed text-white/70">{p.d}</p>
                                            </article>
                                        </Reveal>
                                    ))}
                                </div>
                                <div className="mt-6">
                                    <PartneriCollage
                                        photos={SECTION_PHOTOS.partneri}
                                        accentColor="var(--mk-green)"
                                        shadowColor="rgba(76,193,87,0.5)"
                                        onPhotoClick={openSectionPhoto("partneri")}
                                    />
                                </div>
                            </div>
                        </div>
                        <CtaRow location="after_partneri" />
                    </div>
                </section>

                {/* KONTAKT */}
                <section id="kontakt" className="relative overflow-hidden" style={{ scrollMarginTop: "80px" }}>
                    <Parallax dist={-60} className="absolute -right-32 top-10 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, var(--mk-pink), transparent 60%)" }}>
                        <span />
                    </Parallax>
                    <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-12 md:py-28">
                        <div className="md:col-span-6">
                            <Reveal fromY={44}>
                                <SectionTag label="Kontakt" color="pink" />
                                <h2 className="mk-display mt-5 leading-[1.02] text-[clamp(2rem,7vw,4.25rem)] text-white">
                                    POKRENIMO <span className="mk-pink">GENERACIJU.</span>
                                </h2>
                                <p className="mt-6 max-w-xl text-base text-white/85 sm:text-xl">
                                    „Zajedno gradimo generaciju koja se kreće, uči i raste.“ Ostavite kontakt — vraćamo se
                                    u 24 h s prijedlogom paketa. Bez obaveze.
                                </p>
                            </Reveal>
                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                {[
                                    { href: "tel:+385955144085", label: "Telefon", value: "+385 95 514 4085", color: "text-white", event: "contact_phone_click" },
                                    { href: "https://www.dispet.fun", label: "Web", value: "dispet.fun", color: "mk-yellow", event: "contact_web_click" },
                                    { href: "https://instagram.com/dispet.fun", label: "Instagram", value: "@dispet.fun", color: "mk-pink", event: "contact_instagram_click" },
                                ].map((c, i) => (
                                    <Reveal key={c.label} fromY={36} fromScale={0.94} delay={0.05 + i * 0.05}>
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
                                    </Reveal>
                                ))}
                            </div>
                            <Reveal fromY={24} delay={0.1}>
                                <p className="mt-6 text-sm leading-relaxed text-white/75">
                                    Hvala što podržavaš ovu priču. Hvala što vjeruješ u nas. I hvala što svojim izborom
                                    pomažeš nama — da mi možemo pomoći djeci.
                                </p>
                            </Reveal>
                        </div>
                        <Reveal fromX={56} fromY={24} fromScale={0.97} delay={0.05} className="md:col-span-6">
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
                                <ContactForm preselected={preselectedPackage} />
                            </div>
                        </Reveal>
                    </div>

                    {/* FAQ — answers verbatim from page copy; also in FAQPage schema */}
                    <div className="relative mx-auto max-w-7xl px-5 pb-16 md:pb-20">
                        <Reveal fromY={32}>
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
                        </Reveal>
                    </div>
                </section>

                {/* MERCH — own zone after the sponsor funnel */}
                <section id="merch" className="relative overflow-x-clip bg-mk-navy py-14 sm:py-20 md:py-28">
                    <div className="mx-auto max-w-7xl px-5">
                        <div className="grid items-end gap-8 md:grid-cols-12">
                            <Reveal fromX={-56} fromY={0} className="md:col-span-7">
                                <SectionTag label="Merch kolekcija 2026" color="pink" />
                                <h2 className="mk-display mt-5 leading-[1.02] text-[clamp(2rem,6vw,3.5rem)] text-white">
                                    DIŠPET <span className="mk-pink">MERCH.</span>
                                </h2>
                                <p className="mt-5 text-base text-white/75 sm:text-lg">
                                    Sve kolekcije dostupne i s logom vašeg brenda.
                                </p>
                            </Reveal>
                            <Reveal fromX={40} fromY={0} delay={0.06} className="flex flex-wrap gap-2 md:col-span-5 md:justify-end">
                                <span className="rounded-full border border-[rgba(249,198,53,0.4)] bg-[rgba(249,198,53,0.1)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest mk-yellow">
                                    🇭🇷 100% hrvatski proizvod
                                </span>
                                <span className="rounded-full border border-white/30 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/90">
                                    Dizajn & tisak u Dalmaciji
                                </span>
                                <span className="rounded-full border border-[rgba(247,65,128,0.4)] bg-[rgba(247,65,128,0.1)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest mk-pink">
                                    Zarada → razvoj Dišpeta
                                </span>
                            </Reveal>
                        </div>

                        <Reveal fromY={44} fromScale={0.97}>
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
                        </Reveal>
                    </div>

                    {/* 3D revija + galerija — pinned scroll track */}
                    <MerchStage />

                    <div className="mx-auto max-w-7xl px-5">
                        <Reveal fromY={40}>
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
                        </Reveal>
                        {/* Closing CTA — the zone ends with an exit to the shop */}
                        <Reveal fromY={28} className="mt-10 text-center">
                            <a
                                href="https://dispet.fun/shop"
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackEvent("merch_shop_click", { location: "merch_end" })}
                                className="inline-flex min-h-11 items-center justify-center rounded-full bg-mk-yellow px-8 py-3 text-sm font-bold text-on-bright transition hover:opacity-90"
                            >
                                Posjeti trgovinu →
                            </a>
                        </Reveal>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="border-t border-white/10 bg-mk-navy-deep">
                <div className="mk-rainbow h-1 w-full" />
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

            {/* Section-collage lightbox */}
            <GalleryLightbox
                photos={lightboxSection ? SECTION_PHOTOS[lightboxSection] : []}
                selected={lightboxIdx}
                setSelected={(v) => {
                    setLightboxIdx(v);
                    if (v === null) setLightboxSection(null);
                }}
            />
        </div>
    );
};

export default MarketingPonuda2;
