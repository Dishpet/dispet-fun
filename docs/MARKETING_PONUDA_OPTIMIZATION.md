# Marketing Ponuda — Full Optimization Audit & Redesign Plan

**Page:** `/marketing-ponuda` · **File:** `src/pages/MarketingPonuda.tsx` (+ `src/components/marketing/*`)
**Date:** 2026-06-11
**Goal hierarchy:** 1) sponsor conversions · 2) merch conversions · 3) UX · 4) SEO · 5) AI/GEO visibility · 6) accessibility · 7) performance
**Hard constraints:** visual identity, colors, typography (DynaPuff/Nunito), graphic style and aesthetic stay exactly as they are. No invented facts — every claim below already exists on the page. Missing information is flagged as **GAP**, never fabricated.

---

## 1. Executive Summary

The page is visually strong, on-brand, and content-complete, but it is currently built as a **brochure, not a funnel**. The biggest wins available:

1. **The sponsor journey is interrupted at its hottest point.** The merch block (gallery + 340vh 3D show, ~6–7 viewports of scroll) sits between the packages (`#paketi`) and the proof/contact sections. A sponsor evaluating packages must scroll through a consumer-oriented showcase before reaching partners and the form. Moving merch below the contact section restores an unbroken B2B narrative and shortens the sponsor path by ~40% of scroll depth.
2. **One CTA verb everywhere.** "Zatraži ponudu" exists in the sticky bar but the hero leads with the softer "Pogledaj pakete". Leading with the offer-request and repeating it after each value section (Zašto → Paketi → Digital → Partneri) creates a continuous conversion rail.
3. **Proof exists but arrives too late.** HNK Hajduk, Rocket FA (Rakitić), Automall Split (400+ djece), Splitska Dica are the strongest assets on the page and appear at ~85% scroll depth. They belong directly under the hero (text strip already exists — promote it) and again beside the form.
4. **The page is invisible to crawlers without JavaScript.** It is client-rendered inside a Vite SPA; `<html lang="en">` mislabels Croatian content; no JSON-LD; og:image is relative. Prerendering this single route + schema markup makes the page legible to Google **and** to AI assistants (ChatGPT, Perplexity, Gemini, AI Overviews).
5. **~12MB of avoidable weight.** Two mascot GIFs (7.2MB + 2.8MB) and an un-throttled 3D stage dominate the budget. Converting GIF→WebM (same animation, same look) and lazy-mounting the 3D canvas cuts initial transfer by ~85% with zero visual change.

Expected combined effect (directional, not invented metrics): materially higher sponsor-form submissions from a shorter, proof-anchored path; higher merch click-through from product-level deep links; eligibility for rich results and AI citation that the page currently cannot achieve at all.

---

## 2. Current Page Audit (as built)

**Section order today:**

1. Nav (rainbow scroll-progress bar) + sticky bottom CTA ("Zatraži ponudu", appears ~7% scroll)
2. Hero — H1 "POKRET KOJI POKREĆE." + sub + 2 CTAs ("Pogledaj pakete", "Kontaktirajte nas") + partner-name strip + photo + mascot GIF
3. Stats strip — 10.000+ djece · 3 grada · 100K+ reach (scroll-scrubbed counters)
4. O nama — "ŠTO JE DIŠPET?" (definition, BESPLATNO highlight, 4 pillar chips, photos)
5. Marquee strip (partner names, scroll-driven)
6. Na terenu — "DIŠPET U AKCIJI." (4 photos)
7. Sponzorske površine — "VAŠA REKLAMA NA TERENU." (150m+ / Teren / Sve lokacije)
8. Zašto Dišpet — 6 benefit cards
9. Paketi — "MARKETING MOGUĆNOSTI." 5 channels + Paket po mjeri (links to #kontakt)
10. **Merch** — header/badges → "Svaka kupnja = jedno dijete više na terenu" banner + shop CTA → photo gallery (32 photos) → 3D show (340vh pinned) → mini-kolekcije
11. Ciljevi 2026 — "KAMO IDEMO." (10.000+ / 3 grada)
12. Digital — "DISPET.FUN" (2.000+ Klub, 100K+, 24/7; 4 ecosystem cards; 4 bullets)
13. Partneri — "NAŠI PARTNERI." (4 partner cards + photos)
14. Kontakt — "POKRENIMO GENERACIJU." (phone/web/IG cards, form, 24h promise)
15. Footer

**Inventory of verifiable facts on the page** (the only material Version B may use): free sport/education/fun days for preschool & lower-elementary kids; funded exclusively by sponsors; Split as base; 2026 goals of 10,000+ kids and 3 cities; 100K+ digital impressions/year; 2,000+ Dišpet Klub members; 150m+ of sponsor surfaces (field + fence + surroundings, all city locations); 5 sponsorship channels + custom package; 6 "why sponsor" benefits; partners HNK Hajduk (dječja tribina Poljud, Fan Shop aktivacija), Rocket Football Academy (Ivan Rakitić), Automall Split (strateški partner, 400+ djece u autosalonu), Splitska Dica (festival "Split za djecu"); events across Dalmatia, label "Rekreacija · Edukacija · Iskustvo · 2025."; merch = Majica 30€, Duksica 50€, Kapa 20€, Termosica 20€, 100% Croatian, designed/printed/packed in Dalmatia, sponsor-logo option, all profit funds the project; mini-collections Eko/Zeleni/Zdravi Dišpet; digital ecosystem (web shop, Dječji kutak with AI treninzi & brain games, Klub membership/popusti/merch drops, blog/newsletter); contact +385 95 514 4085, dispet.fun, @dispet.fun, answer within 24h, "bez obaveze", "Vaši podatci ostaju kod nas"; quote „Zajedno gradimo generaciju koja se kreće, uči i raste."

**GAPS identified (do not fabricate — collect from client instead):**
- No **event dates/calendar** → blocks `Event` schema and "kada je sljedeći Dišpet?" answerability.
- No **email address** anywhere (phone + IG + web only) → friction for procurement/marketing departments that won't call.
- No **partner logos or quotes** (names only) → trust strip is text-only; a one-line quote from any partner would be the single strongest addition.
- No **sponsor pricing anchors** (even "od X €") → harder qualification; acceptable if intentional ("paket po mjeri").
- No **legal identity** (udruga/OIB) in footer → weakens E-E-A-T and B2B credibility.
- No **past-edition numbers** besides Automall's 400+ (e.g., total kids in 2025) → counters show only 2026 *goals*; label them clearly as goals (already done: "cilj 2026.") and add real 2025 numbers when available.
- No **privacy policy link** at the form (only the reassurance sentence).

---

## 3. UX Audit

| # | Finding | Severity |
|---|---|---|
| U1 | Merch mega-block (gallery + 340vh pinned 3D) interrupts the sponsor narrative mid-funnel | High |
| U2 | Two competing hero CTAs with equal visual weight; primary action ambiguous | High |
| U3 | Partner proof (strongest trust asset) at ~85% scroll depth | High |
| U4 | 4 anchor sections between nav links and actual content order mismatch (nav: O nama→Teren→Paketi→Merch→Digital→Partneri; page inserts Površine/Zašto between Teren and Paketi) — minor disorientation | Med |
| U5 | Pinned 3D show costs ~3.4 viewports; on mobile that is a long "trapped" scroll with one product visible at a time | Med |
| U6 | Stats counters scrub with scroll (display 0 until scrolled) — a user who pauses mid-entry sees undercounted numbers; fine UX-wise but ensure final values are reached well before the strip leaves the viewport (currently completes at 45% viewport — OK) | Low |
| U7 | Sticky CTA + mobile keyboard + form = the bar can cover the submit button on small phones once dismissed-state is false | Med |
| U8 | Form success state has no next step (e.g., "while you wait — see packages/shop") — dead end | Low |

---

## 4. CRO Audit

**First impression / above the fold (desktop):** brand promise + photo + mascot = clear identity, emotional hook strong. Weaknesses: (a) value proposition for the *sponsor* ("vaš brend kroz igru, ne kroz reklamu" — the page's sharpest line) is buried in section 7; (b) the two hero buttons split intent; (c) partner names render in low-emphasis white/70 without a label — first-time visitors don't register them as *proof*.

**Sponsor path today:** Hero → (7 sections, ~9 viewports incl. merch detour) → Paketi → (merch detour ~6 viewports) → Digital → Partneri → Form. **Friction points:** length, detour, single form entry point at the very bottom, no mid-page CTA between Zašto and Paketi, package cards are not clickable (only the dashed "Paket po mjeri" links to #kontakt).

**Merch path today:** one CTA ("Posjeti trgovinu →") at the *top* of the merch block; after the user invests ~6 viewports in gallery + 3D show there is **no closing CTA** — the show ends into mini-kolekcije with no shop link. The 3D act labels show prices but aren't links.

**What hurts sponsor conversions:** detour (U1), CTA dilution (U2), late proof (U3), no per-package CTA, missing email (GAP), counters labeled as goals are honest but lonely — pair them with the one real number that exists (Automall 400+ djece) for grounding.

**What hurts merch sales:** no CTA at the end of the experience, no product-level deep links, gallery photos not linked to shop, "Svaka kupnja = jedno dijete" (the best merch argument) shown once at the top where shop intent hasn't formed yet.

**Remove:** nothing (content is lean). **Move:** merch block, partner proof. **Emphasize:** Zatraži ponudu verb, partner strip label, 24h promise near every CTA. **Simplify:** hero to one primary + one ghost CTA.

---

## 5. Information Architecture — ideal hierarchy

**Version A target order (copy unchanged, sections re-ordered/merged):**

1. **Hero** — H1 + sub + primary CTA "Zatraži ponudu" (anchor #kontakt) + ghost CTA "Pogledaj pakete" (#paketi) + labeled partner strip ("Partneri:") + photo/mascot
2. **Stats strip** (10.000+ · 3 grada · 100K+) — unchanged
3. **O nama / Što je Dišpet** (entity definition — also the GEO answer block)
4. **Na terenu** (photo proof) + marquee strip directly after (energy)
5. **Zašto sponzori biraju Dišpet** (6 cards) → inline CTA row ("Zatraži ponudu · odgovor u 24h")
6. **Paketi** (5 + po mjeri) — every card gets a "Zatraži ponudu →" footer link; **merge "Sponzorske površine" detail (150m+/Teren/Sve lokacije + photo) into/immediately after package 01** as supporting detail
7. **Digital ekosustav** (2.000+ Klub, 100K+, 24/7, 4 cards, bullets) — sponsor-relevant reach
8. **Ciljevi 2026** (kamo idemo)
9. **Partneri** (4 cards + photos) — proof immediately before the ask
10. **Kontakt + form** (sponsor conversion point)
11. **Merch zone** (separate audience, after the B2B funnel): header + badges → "Svaka kupnja…" banner → gallery → 3D show → mini-kolekcije → **closing shop CTA**
12. Footer (+ legal identity GAP when available)

**Navigation:** order links to match: O nama · Na terenu · Zašto · Paketi · Digital · Partneri · **Merch** · Kontakt(button). Keep rainbow progress bar.

**Reading flow rationale:** classic B2B arc — promise → proof-tease → who we are → live proof → why us → what you can buy → reach → trajectory → who already trusts us → ask. Merch becomes a destination ("come for the sponsorship, stay for the shop") instead of an interruption, and inherits traffic from the thank-you/success state and footer.

---

## 6. SEO Audit & Recommendations

**Technical (highest impact first):**

| Item | Now | Fix |
|---|---|---|
| Rendering | Pure CSR — empty `<div id="root">` for crawlers without JS execution; AI crawlers (GPTBot, PerplexityBot, ClaudeBot) largely **do not execute JS** | Prerender this route to static HTML at build (e.g. `vite-plugin-prerender` / `vite-ssg` for `/marketing-ponuda` only), or serve a build-time snapshot via `server.js`. This single change unlocks every other SEO/GEO benefit |
| `<html lang>` | `lang="en"` on Croatian content (`index.html:2`) | `lang="hr"` (site-wide fix; also a WCAG 3.1.1 fix) |
| Canonical | `https://dispet.fun/marketing-ponuda` ✓ via SEOHead | Keep; ensure trailing-slash consistency in server redirects |
| og:image | Relative path (`SEOHead` default) — breaks share previews | Absolute `https://dispet.fun/marketing/hero.jpg` (1200×630 crop) |
| Sitemap/robots | No sitemap entry for the route | Add `/marketing-ponuda` to sitemap.xml; ensure robots.txt doesn't block; explicitly allow `GPTBot`, `Google-Extended`, `PerplexityBot`, `ClaudeBot` if AI visibility is wanted |
| URL | `/marketing-ponuda` — clean, keyworded, kebab-case ✓ | Keep |

**Title/meta (uses only existing wording):**
- Title: `Dišpet — Marketing ponuda 2026 | Sponzorstva za dječja događanja u Splitu i Dalmaciji` (≤60 chars trim as needed; every word exists on page: marketing ponuda 2026, sponzori, djeca, Split, Dalmacija)
- Meta description: reuse the existing sentence: "Besplatan dan sporta, edukacije i zabave za djecu. Sponzorske površine, digitalna vidljivost, aktivacija na terenu i merch s vašim logom — Split, cilj 2026: 3 grada i 10.000+ djece."

**Heading hierarchy:** keep single H1 ✓. Make every section heading a true `<h2>` (already done) and promote card titles in Paketi/Partneri to `<h3>` (Paketi already h3 ✓; convert partner card titles and "why" card titles from `div` → `h3` for outline completeness). Use `<section aria-labelledby>` per block.

**Semantic HTML:** packages list → `<ul>/<li><article>`; partner cards → `<article>`; stats → `<dl><dt><dd>`; the 3D act labels and prices already exist as real DOM text — keep (it's the text alternative for canvas content).

**Internal linking:** link "dispet.fun/shop" mentions per-product using the documented deep-link params (`docs/MARKETING_URLS.md`): e.g. Majica → `https://dispet.fun/shop?product=tshirt&mode=customizing`. Anchor text = product name (descriptive, keyword-bearing). Add one contextual link from "Dječji kutak" card → `/games`, "Blog & novosti" → `/blog` (true internal pages).

**Image SEO:** rename generic files when convenient (`roba-07.jpg` → `dispet-majica-dalmacija-07.jpg` — names reflect real content only); alt text strategy below in Accessibility; add `width`/`height` attributes (also CLS).

**Keyword opportunities (all present in copy):** "sponzorstvo dječjih događanja", "marketing ponuda", "sponzorske površine", "aktivacija na terenu", "dječji merch", "Split", "Dalmacija", "besplatna događanja za djecu". **Content gaps (GAP, don't invent):** event calendar page, sponsor case study page (Automall 400+ is the seed), FAQ entries about how sponsorship works in practice.

**Featured snippet / FAQ opportunities (truthfully answerable today):**
- "Što je Dišpet?" → existing definition paragraph.
- "Koliko košta Dišpet merch?" → existing prices (30/50/20/20 €).
- "Kako se Dišpet financira?" → "isključivo od sponzora — za djecu uvijek besplatno."
- "Gdje se Dišpet održava?" → "Split kao baza, događanja diljem Dalmacije; cilj 2026: 3 grada."
- "Kako postati sponzor?" → "ispunite formu — odgovor u 24h, paket po mjeri."
Render as a visible FAQ accordion in the Kontakt zone + `FAQPage` schema.

**JSON-LD (implement via existing `SEOHead schema` prop or a second `<script type="application/ld+json">`):**
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://dispet.fun/#org",
      "name": "Dišpet",
      "url": "https://dispet.fun",
      "logo": "https://dispet.fun/marketing/dispet-logo-official.png",
      "description": "Pokret i projekt koji spaja zabavu, sport i edukaciju za djecu predškolske dobi i nižih razreda osnovne škole. Besplatno za svu djecu — financira se isključivo od sponzora.",
      "areaServed": "Dalmacija, Hrvatska",
      "location": { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": "Split", "addressCountry": "HR" } },
      "telephone": "+385955144085",
      "sameAs": ["https://instagram.com/dispet.fun"]
    },
    { "@type": "WebPage", "@id": "https://dispet.fun/marketing-ponuda", "name": "Dišpet — Marketing Ponuda 2026", "inLanguage": "hr", "isPartOf": { "@id": "https://dispet.fun/#org" } },
    {
      "@type": "OfferCatalog",
      "name": "Sponzorski paketi 2026",
      "itemListElement": [
        { "@type": "Offer", "name": "Sponzorske površine", "description": "150m+ ograde, brendirani paneli i logo na svim materijalima na terenu." },
        { "@type": "Offer", "name": "Digitalna vidljivost", "description": "dispet.fun, društvene mreže, foto i video sadržaj te newsletter." },
        { "@type": "Offer", "name": "Aktivacija na terenu", "description": "Vlastiti štand, dijeljenje proizvoda i sponzorstvo igara." },
        { "@type": "Offer", "name": "Reklamni materijali", "description": "Majice i oprema s vašim logom, pokloni za djecu, web integracija." },
        { "@type": "Offer", "name": "Medijske kampanje", "description": "Zajednički PR nastup i koordinirane kampanje na svim kanalima." }
      ]
    },
    { "@type": "Product", "name": "Dišpet majica", "offers": { "@type": "Offer", "price": "30", "priceCurrency": "EUR", "url": "https://dispet.fun/shop?product=tshirt" } },
    { "@type": "Product", "name": "Dišpet duksica", "offers": { "@type": "Offer", "price": "50", "priceCurrency": "EUR", "url": "https://dispet.fun/shop?product=hoodie" } },
    { "@type": "Product", "name": "Dišpet kapa", "offers": { "@type": "Offer", "price": "20", "priceCurrency": "EUR", "url": "https://dispet.fun/shop?product=cap" } },
    { "@type": "Product", "name": "Dišpet Termosica", "offers": { "@type": "Offer", "price": "20", "priceCurrency": "EUR", "url": "https://dispet.fun/shop?product=bottle" } },
    { "@type": "FAQPage", "mainEntity": [ /* the 5 Q&A above, verbatim from page copy */ ] }
  ]
}
```
Do **not** add `Event` (no dates), `Review`/`AggregateRating` (no reviews), or `award` fields — GAPs.

---

## 7. AI Search / GEO Audit & Recommendations

AI assistants extract answers from **server-delivered text** with clear entity statements. Actions:

1. **Prerender** (see SEO) — without it the page contributes nothing to AI training/retrieval.
2. **Entity sentence above the fold** (visible, not hidden): the O nama definition already is one — move a one-line version into the hero sub or keep O nama as section 3 so the first extractable chunk states *who/what/where/for whom/how funded*. The existing sentence "Dišpet nije događaj — Dišpet je pokret i projekt koji spaja zabavu, sport i edukaciju…" is ideal; ensure it survives in plain `<p>` text.
3. **Answer-shaped chunks:** each section currently leads with a stylized heading + short paragraph — good. Keep paragraphs ≤ 3 sentences (already true). Add the FAQ block (5 Q&A above) — FAQ format is the highest-yield GEO structure.
4. **Consistent entity naming:** always "Dišpet" (never stylized DI/Š/PET splits in text nodes — the nav logo splits letters across spans, which is fine for the logo but ensure at least one plain-text "Dišpet" exists in header/footer; footer already has it inside spans — add `aria-label="Dišpet"` + plain text in the copyright line ✓ already "© 2026 Dišpet · dispet.fun").
5. **Citable numbers with units and labels:** counters render as text ✓ but they animate from 0; prerendered HTML must contain the **final** values (render final value server-side / in noscript or set initial state to the real number and only animate visually — implementation: initialize `ScrollCount` state to the target value, then animate after hydration; crawlers see "10.000+").
6. **Why-sponsor / why-buy summaries:** add a compact `<ul>` ("Zašto sponzorirati Dišpet" — 6 existing bullets; "Zašto kupiti merch" — 3 existing facts: 100% hrvatski proizvod, izrađeno u Dalmaciji, sva zarada ide djeci) — lists are extraction-friendly.
7. **E-E-A-T:** surface the real-world anchors AI models weigh: partner names with their factual descriptions, phone number, physical locality (Split), the 2025 label on event photos. **GAP:** legal entity name + email would strengthen this further.

---

## 8. Accessibility Audit & Recommendations (WCAG 2.1 AA)

| Issue | WCAG | Fix |
|---|---|---|
| `<html lang="en">` | 3.1.1 | `lang="hr"` |
| Lightbox has no focus trap; focus stays behind the dialog; Esc works ✓ | 2.4.3 / 1.3.2 | `role="dialog" aria-modal="true"`, trap focus, return focus to the thumbnail on close |
| Gallery thumbs: alt "Dišpet merch fotografija N" — acceptable; number chip is decorative ✓ | 1.1.1 | Keep; mark chip `aria-hidden` (done) |
| 3D canvas has no text alternative *contract* | 1.1.1 | Wrap canvas in `<figure role="img" aria-label="3D prikaz proizvoda: majica 25€, hoodica 50€, kapa 20€, termo boca 20€ s izmjenom dizajna">`; the HTML act labels remain visible text ✓ |
| Scroll-jacked 340vh section is keyboard/scroll-heavy | 2.3.3 | `prefers-reduced-motion` already renders static ✓; also add a visible "Preskoči 3D prikaz" skip-link before the track jumping to the next anchor |
| Sticky bottom bar can obscure content/focused submit on small screens | 2.4.11 (2.2) | Add `scroll-margin-bottom` to form; auto-hide bar when #kontakt is in view (it duplicates the same CTA) |
| Small uppercase labels at `text-white/55`–`/60` over navy | 1.4.3 | Raise to `/70` minimum (visual difference negligible, ratio ≥4.5:1) |
| Form: field errors not announced | 3.3.1 | `aria-live="polite"` on error spans (server error already `role="alert"` ✓); `aria-describedby` wiring exists in reference form — replicate |
| Marquee/auto-motion | 2.2.2 | All movement is scroll-driven (user-controlled) ✓ — keep; ensure no time-based autoplay anywhere except mascot video (give it `prefers-reduced-motion` static poster) |
| Focus visibility | 2.4.7 | Most controls have `focus-visible` rings from the reference port; audit gallery buttons + dots (add `focus-visible:ring-2 ring-[var(--mk-pink)]`) |
| Skip link | 2.4.1 | Add "Preskoči na sadržaj" before nav |

---

## 9. Device Optimization Audit

**Mobile (small 320–375px / standard 390–430px / large 430+ / foldables):**
- Hero: clamp() sizes hold ✓; move mascot GIF behind the photo card on <360px (already responsive positions) and ensure CTAs are full-width tap targets ≥44px ✓.
- Thumb reach: primary CTA also lives in the sticky bottom bar ✓ — keep; make "Zatraži ponudu" the **left/first** element (thumb zone), dismiss X stays right.
- 3D track: reduce to `h-[280vh]` on `<md` (less trapped scroll), keep one-act-at-a-time (already ideal for mobile); act labels text-2xl ✓.
- Gallery: cards 170px tall on mobile — bump tap area is fine; ensure horizontal rows don't capture vertical scroll (they don't — transform only) ✓.
- Form above keyboard: `scroll-margin`, hide sticky bar at #kontakt (see A11y).
- Content density: stats strip 3-up stays readable at 320px (clamp font) ✓.

**Tablet:** portrait — hero grid stacks (md: breakpoint flips at 768 — verify hero image doesn't render before H1; in DOM image is second ✓). Landscape — 12-col grids already balanced; pinned 3D occupies full height nicely.

**Desktop (13" / 15" / 27" / ultra-wide):**
- `max-w-7xl` keeps line lengths sane on 27"+ ✓; on ultra-wide add `max-w-[1600px]` only to the 3D/gallery full-bleed zones if edges feel empty (optional).
- Visual hierarchy: hero H1 at clamp 5.75rem dominates ✓.
- Conversion path: with new IA, the right rail of Kontakt (form) lands at ~ first fold of its section on 1080p — good.

---

## 10. Performance Audit & Recommendations

**Current weight (route-specific):** mascot GIFs **7.2MB + 2.8MB** (≈83% of page weight!), 32 gallery JPEGs ≈2MB (lazy), 9 reference photos ≈1.6MB, 4 GLB models ≈1.17MB, drei `Environment preset="city"` pulls an HDR (~2–4MB) from a CDN at runtime, three.js+R3F+drei in the route chunk, full Nunito ital range + DynaPuff from Google Fonts.

**Prioritized fixes (no visual change):**

1. **GIF → `<video>` WebM/MP4** (muted autoplay loop playsinline, poster fallback): dance GIF 7.2MB → ~300–500KB; wave 2.8MB → ~150KB. Same animation, ~94% smaller. *(LCP, bandwidth, mobile)*
2. **Lazy-mount the 3D canvas** with an IntersectionObserver 1–2 viewports ahead (the component already starts "appearing sooner"; mount the `<Canvas>` itself only when the merch zone approaches). Defers three.js execution + GLB + HDR off the critical path. *(INP/TBT, LCP)*
3. **Replace `Environment preset="city"`** with the same HDR **self-hosted** (`/public/hdr/potsdamer_platz_1k.hdr`, `files=` prop) — removes third-party dependency and enables caching; or bake to lights for further savings (visual check required — flag, do not silently change look).
4. **Hero LCP:** add `<link rel="preload" as="image" href="/marketing/hero.jpg" fetchpriority="high">` for the route (Helmet), plus explicit `width`/`height` on all `<img>` (CLS → ~0).
5. **Responsive images:** generate 640w/1280w variants for roba + reference photos, serve via `srcset/sizes`; thumbs in marquee never need >640w (cuts gallery transfer ~60%).
6. **Fonts:** request only used weights (`Nunito:wght@400;600;700;800` + `DynaPuff:wght@600;700`), keep `display=swap` ✓, add `preconnect` ✓ (exists). Optional: self-host two woff2 files.
7. **Canvas hygiene:** `dpr={[1, 1.75]}` ✓; add `frameloop` pause when track not in viewport (set `invalidate`-based loop or toggle `frameloop="never"` off-screen); `powerPreference: "high-performance"`.
8. **Server:** enable `compression()` (brotli/gzip) and long-cache headers for `/marketing/*`, `/models/*` in `server.js` (immutable, 30d+). Models/photos are content-hashed by name? No → use `Cache-Control: public, max-age=2592000` and bump filenames on change.
9. **Animation perf:** all scroll work is transform/opacity ✓ (compositor-friendly); avoid animating `filter`/layout; framer `useScroll` is passive ✓. Keep `will-change` implicit via motion.
10. **CWV targets after fixes:** LCP < 2.0s on 4G (hero preloaded, GIF gone), CLS ≈ 0 (dimensions), INP < 200ms (3D deferred, no long tasks at load).

---

## 11. Sponsor Conversion Funnel (Version A — final)

```
AWARENESS    Hero: promise + 1° CTA "Zatraži ponudu" + labeled partner strip
             ↓ (sticky bar mirrors the same CTA from 7% scroll)
INTEREST     Stats → Što je Dišpet (definition) → Na terenu (visual proof)
             ↓
DESIRE       Zašto sponzori (6 benefita)  → inline CTA #1 (24h promise)
             Paketi 01–05 + po mjeri      → per-card "Zatraži ponudu →"
             (Površine detail merged at 01)
             Digital (2.000+ klub · 100K+ · 24/7) → inline CTA #2
             Ciljevi 2026 (kamo idemo)
PROOF        Partneri: Hajduk · Rocket FA · Automall (400+ djece) · Splitska Dica
             ↓
ACTION       Kontakt: form (package preselect via CTA source), tel/IG/web cards,
             FAQ accordion, "Odgovor u 24h · bez obaveze · podatci ostaju kod nas"
POST         Success state: hvala poruka + linkovi (Paketi PDF GAP / Merch / IG)
```
CTA mechanics: every "Zatraži ponudu" anchor passes `?paket=` (or sets the form select via state) so the form arrives pre-filled — removes one decision at the moment of highest intent.

## 12. Merch Conversion Funnel (Version A — final)

```
ENTRY        Nav "Merch" · footer link · sponsor-form success state · hero scroll-through
HOOK         "Svaka kupnja = jedno dijete više na terenu" banner (impact framing)
BROWSE       Gallery (real photos) → 3D show (4 products × 2 designs)
PRODUCT      Act labels become links: "Majica 25€ → Kupi" (deep link per product:
             dispet.fun/shop?product=tshirt&mode=customizing … per MARKETING_URLS.md)
CLOSE        End-of-zone CTA block: "Posjeti trgovinu →" + mini-kolekcije
CROSS        Sponsor angle inside merch zone: postojeća rečenica "Sve kolekcije
             dostupne i s logom vašeg brenda" + link natrag na #paketi (reklamni materijali)
```

---

## 13. Version A — implementation spec (copy 100% unchanged)

Concrete changes, file by file:

1. `src/pages/MarketingPonuda.tsx`
   - Reorder sections per §5; move whole merch block after Kontakt.
   - Hero: primary `bg-mk-pink` button → "Zatraži ponudu" (#kontakt); ghost → "Pogledaj pakete". (Both labels already exist on the page — sticky bar text reused; no new copy.)
   - Partner strip: prefix with the existing word "Partneri" (from section title "NAŠI PARTNERI.") as a small label.
   - Paketi cards: append existing CTA text "Zatraži ponudu" as card-footer link → #kontakt (sets select value to the package title).
   - After Zašto and after Digital: insert one centered CTA row reusing the sticky-bar strings ("Zatraži ponudu" + "Kreiramo paket po mjeri — odgovor u 24h.").
   - Merch zone end: reuse the existing "Posjeti trgovinu →" button after mini-kolekcije; act labels in `MerchShowcase3D` become `<a>` deep links (label/price text unchanged).
   - Kontakt: add FAQ accordion built from existing sentences (§6 list); add `id` plumbing for package preselect; success state gains two links (Trgovina, Instagram) using existing labels.
   - Nav: reorder + add "Merch" anchor (link label exists).
2. `index.html`: `lang="hr"`.
3. `SEOHead` usage: absolute og:image; pass the JSON-LD graph (§6) via `schema` prop.
4. `MerchGallery/MerchShowcase3D`: a11y additions (§8), lazy-mount canvas, GIF→video swap in hero/kontakt, image dimensions + srcset (§10).
5. `server.js`: compression + cache headers (§10.8); prerender output served for `/marketing-ponuda` (§6.1).

Each change pairs to the audit line that motivates it; none alters wording, color, type, or style.

**Expected impact:** sponsor path shortened from ~15 to ~9 viewports with proof adjacent to the ask and 4× more CTA surface (hero, 2 inline rows, per-package, sticky) → meaningfully higher form-start rate; merch zone gains a closing CTA + 4 product deep links where today there are zero exits at the moment of peak interest. SEO/GEO: from non-indexable SPA shell to prerendered, schema-annotated, FAQ-bearing page — eligible for rich results and AI citation. Performance: ~12MB → ~2.5MB initial route weight.

---

## 14. Version B — Conversion-optimized copy (A/B variant)

Rules honored: every number, name, price and promise below already exists on the page; tone is human, local (lightly Dalmatian — "dica", "u sridu", "naša škvadra" used sparingly and only where natural), zero corporate filler. Section order = Version A order.

### Nav CTA
**Kontakt** → **Postani sponzor**

### Sticky bar
- Title: **"Uđite u priču za 2026."**
- Sub: **"Paket po mjeri — odgovor u 24 sata."**
- Button: **"Zatraži ponudu"** (unchanged — it performs)

### 1) Hero
- Tag: `Marketing ponuda · 2026` (unchanged)
- H1: **POKRET KOJI POKREĆE.** (brand line — keep)
- Sub (rewrite): **"Besplatan dan sporta, edukacije i smijeha za dicu — od Splita prema još dva grada. Sponzori su jedini razlog što ovo postoji. Budite jedan od njih."**
- Primary CTA: **"Zatraži ponudu"** · Ghost: **"Vidi što nudimo"**
- Strip label: **"Uz nas već stoje:"** HNK Hajduk · Rocket FA · Automall Split · Splitska Dica

*Why:* sub now names the audience (dica), the geography (Split + 2 grada), the funding model (sponzori jedini razlog) and turns it into the ask — all facts from the page, repackaged as one breath. "Uz nas već stoje" converts a name list into social proof.

### 2) Stats strip
Labels sharpened (numbers untouched, honesty kept):
- **10.000+** — "dice na terenu — cilj za 2026."
- **3** — "grada — Split je baza, širimo se"
- **100K+** — "pregleda godišnje na digitalu"

### 3) Što je Dišpet
- H2: **ŠTO JE DIŠPET?** (keep)
- Body (rewrite): **"Dišpet nije jedan događaj. To je projekt koji spaja igru, sport i edukaciju za predškolce i niže razrede osnovne. Roditelji ne plaćaju ništa — račun pokrivaju sponzori. Zato svaki logo na našem terenu znači: još jedno dite više na terenu."**
- Chips: Sport · Edukacija · Digital · Kreativa (unchanged)

*Why:* keeps the BESPLATNO logic but converts it into the sponsor's cause-and-effect sentence — the page's core conversion argument, now stated in one line.

### 4) Na terenu
- H2: **DIŠPET U AKCIJI.** (keep)
- Body (tightened): **"Svako događanje: puna energija, smijeh i sport — uz profesionalni kadar, diljem Dalmacije. Pogledajte kako to izgleda kad se vaš brend vidi kroz igru, a ne kroz reklamu."**

*Why:* borrows the strongest line from "Zašto" early, planting the differentiator before the benefits section.

### 5) Zašto sponzori biraju Dišpet
- H2: **ZAŠTO SPONZORI BIRAJU DIŠPET?** (keep)
- Cards (sharpened, same facts):
  1. **Oči u oči** — "Direktan kontakt s dicom i roditeljima, na terenu."
  2. **Brend kroz igru** — "Vaš logo se gleda s osmijehom, ne presk skače se kao oglas."
  3. **Zdrave asocijacije** — "Sport, zabava, zdravlje — uz to želite stajati."
  4. **Lokalna stvar** — "Split kao baza, tri grada u 2026. Zajednica vas pamti."
  5. **Foto & video** — "Profesionalna dokumentacija — s vašim logom u kadru."
  6. **100.000+ pregleda** — "Digitalni doseg kroz cijelu sezonu."
- Inline CTA row: **"Recite nam cilj — složit ćemo paket. Odgovor u 24 sata."** [Zatraži ponudu]

### 6) Paketi
- H2: **PET NAČINA DA UĐETE U IGRU.** (replaces "MARKETING MOGUĆNOSTI." — same promise, more concrete)
- Intro: **"Birajte jedan kanal ili kombinirajte sve — svaki paket krojimo po vašim ciljevima i budžetu."**
- Cards: titles unchanged (01–05); descriptions kept (factual). "Paket po mjeri" card: **"Ne tražite gotov paket? Recite što vam triba — sve je dogovorljivo."** CTA: **"Dogovorite poziv →"** (keep)
- Per-card footer link: **"Zatraži ponudu →"**

### 7) Digital
- H2: **DISPET.FUN** (keep)
- Sub: **"Nije samo web — trgovina, Dječji kutak, Klub i blog rade za vaš brend 24/7."**
- Stats labels: "2.000+ članova Kluba" · "100K+ pregleda godišnje" · "24/7 vaš logo online" 
- Bullets (keep all four, verbatim).

### 8) Ciljevi 2026
- H2: **KAMO IDEMO.** (keep)
- Card copy unchanged (10.000+ / 3 grada — already crisp).

### 9) Partneri
- H2: **S NAMA SU OD POČETKA.** (replaces "NAŠI PARTNERI." — stronger proof frame, no new claims)
- Cards: facts unchanged (Hajduk/Poljud tribina; Rocket FA/Rakitić; Automall/400+ dice u autosalonu; Splitska Dica/festival).

### 10) Kontakt
- H2: **POKRENIMO GENERACIJU.** (keep — it's the page's emotional peak)
- Body: **"„Zajedno gradimo generaciju koja se kreće, uči i raste." Ostavite kontakt — u 24 sata vraćamo se s prijedlogom paketa. Bez obaveze, bez natezanja."**
- Form heading: **"Zatraži ponudu"** (keep) · sub **"Odgovor u 24h · bez obaveze"** (keep)
- Submit: **"Pošalji upit"** (keep) · reassurance line kept.
- FAQ (5 Q&A from §6, verbatim answers).

### 11) Merch zone
- H2: **DIŠPET MERCH.** (keep)
- Sub: **"Sto posto hrvatski proizvod — dizajnirano, tiskano i pakirano u Dalmaciji. I da: sve može i s logom vašeg brenda."**
- Banner: **"Svaka kupnja = jedno dite više na terenu."** + **"Sva zarada ide u nova događanja, opremu i nove lokacije. Kupnjom ne kupujete samo majicu — plaćate nekom malom ulaznicu na teren."** CTA: **"Posjeti trgovinu →"** (keep)
- 3D act labels → links: **"Majica · 30€ → Kupi"** etc.
- Mini-kolekcije: unchanged (Eko/Zeleni/Zdravi + their slogans).
- Closing CTA: **"Vidi cijelu kolekciju na dispet.fun/shop →"**

### 12) Footer
- Adds plain sentence (existing facts): **"Dišpet — Split · dispet.fun · +385 95 514 4085 · @dispet.fun"** *(legal name = GAP)*

**Major copy-change rationale (summary):** every rewrite converts a *description* into a *cause-effect or instruction* aimed at the sponsor ("logo na terenu = dite više na terenu", "recite cilj — složit ćemo paket"), pulls the differentiator ("kroz igru, ne kroz reklamu") forward, and frames merch as impact purchase ("ulaznica na teren"). Dialect dosage: dica/dite/triba only — readable to all Croatian speakers, unmistakably local.

---

## 15. Complete wireframe (top → bottom, both versions)

```
┌─ NAV: logo · O nama Na terenu Zašto Paketi Digital Partneri Merch · [Postani sponzor]
│  └ rainbow scroll-progress bar
├─ HERO: tag / H1 / sub / [Zatraži ponudu] [Vidi što nudimo]
│        "Uz nas već stoje:" Hajduk·RocketFA·Automall·Splitska Dica   | photo+mascot(video)
├─ STATS: 10.000+ · 3 · 100K+  (dl, final values in HTML)
├─ ŠTO JE DIŠPET: definicija (GEO answer block) + chips + foto
├─ NA TERENU: 4 fotke (parallax) + marquee traka
├─ ZAŠTO: 6 kartica (h3) → [CTA red: Zatraži ponudu · 24h]
├─ PAKETI: 01–05 (+ površine detalj uz 01) + po mjeri  · svaki → [Zatraži ponudu →]
├─ DIGITAL: 3 broja + 4 kartice + bulleti → [CTA red #2]
├─ CILJEVI 2026: 2 kartice
├─ PARTNERI: 4 kartice (h3, article) + 2 fotke
├─ KONTAKT: H2 + quote · tel/web/IG kartice · FORM (preselect paketa) · FAQ akordeon
├─ MERCH: H2 + badges → banner [Posjeti trgovinu→] → GALERIJA (marquee, lightbox)
│         → 3D REVIJA (sticky, 4 akta, glitch; labeli=linkovi "Kupi") 
│         → mini-kolekcije → [Vidi cijelu kolekciju →]
└─ FOOTER: logo · partneri · kontakt podaci · © (legal GAP)
   STICKY CTA BAR (mobile-first, hides on #kontakt)
```

## 16. Prioritized implementation roadmap

| P | Task | Effort | Impact |
|---|---|---|---|
| 1 | GIF→WebM, hero preload, img dimensions | S | Perf/LCP — biggest single win |
| 1 | Section reorder + hero CTA swap + partner-strip label (Version A core) | M | Sponsor CVR |
| 1 | `lang="hr"`, absolute og:image, title/meta | S | SEO baseline |
| 2 | Per-package CTAs + form preselect + inline CTA rows | M | Sponsor CVR |
| 2 | Merch closing CTA + 3D label deep links | S | Merch CVR |
| 2 | JSON-LD graph + FAQ section | M | SEO/GEO rich results |
| 2 | Prerender `/marketing-ponuda` | M/L | SEO/GEO — unlocks everything |
| 3 | Lightbox focus trap, skip links, contrast bumps, aria-live | M | A11y |
| 3 | Lazy-mount 3D, self-host HDR, srcset variants, compression+cache headers | M | Perf/INP |
| 4 | Version B copy A/B test (behind a flag or split URL `/marketing-ponuda?v=b`) | M | CVR validation |
| 5 | Close GAPs with client: email, legal name, partner quote, event dates, 2025 numbers | — | Trust/E-E-A-T ceiling |

**Measurement plan (gtag events already wired):** track `cta_request_offer_click` by `location` (now: hero/sticky/nav/per-package/inline-1/inline-2), `contact_form_submit`, `merch_shop_click` + new `merch_product_click` per product; compare scroll-depth to form-start rate pre/post; A/B Version B on a 50/50 split.
