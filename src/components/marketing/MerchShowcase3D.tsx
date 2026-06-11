import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, Environment, useProgress } from "@react-three/drei";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useTransform,
    useMotionValueEvent,
    useReducedMotion,
    type MotionValue,
} from "framer-motion";

const trackEvent = (name: string, params?: Record<string, unknown>) => {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", name, params || {});
};

/** Deep links into the shop configurator (see docs/MARKETING_URLS.md) */
const shopUrl = (id: string) => `https://dispet.fun/shop?product=${id}&mode=customizing`;

/* ------------------------------------------------------------------ */
/*  Shop assets — same design collections the Shop page uses           */
/* ------------------------------------------------------------------ */
const streetGlob = import.meta.glob("/src/assets/design-collections/street/*.png", { eager: true, as: "url" });
const vintageGlob = import.meta.glob("/src/assets/design-collections/vintage/*.png", { eager: true, as: "url" });
const logoGlob = import.meta.glob("/src/assets/design-collections/logo/*.png", { eager: true, as: "url" });
const codedGlob = import.meta.glob("/src/assets/design-collections/color-coded-logo/*.png", { eager: true, as: "url" });

const fromGlob = (glob: Record<string, unknown>, name: string) =>
    (Object.entries(glob).find(([p]) => p.endsWith("/" + name))?.[1] as string) || "";

/** Color-coded front logos (shop "logo sync" rule: front follows body color). */
const CODED_BY_COLOR: Record<string, string> = {};
Object.entries(codedGlob).forEach(([path, url]) => {
    const m = path.match(/logo-(.+)\.png$/);
    if (!m) return;
    if (m[1] === "grey-white") {
        CODED_BY_COLOR["#d1d5db"] = url as string;
        CODED_BY_COLOR["#ffffff"] = url as string;
    } else {
        CODED_BY_COLOR["#" + m[1]] = url as string;
    }
});

/* ------------------------------------------------------------------ */
/*  Real product photography (DIŠPET ROBA shoot) — gallery underlay    */
/* ------------------------------------------------------------------ */
const PHOTOS = Array.from({ length: 32 }, (_, i) => `/marketing/roba/roba-${String(i + 1).padStart(2, "0")}.jpg`);

const WIDTHS = [
    "w-[220px] md:w-[400px]",
    "w-[180px] md:w-[310px]",
    "w-[250px] md:w-[500px]",
    "w-[200px] md:w-[360px]",
];

/** One marquee row, driven by the SHOWCASE track progress (slow drift). */
const GalleryRow = ({
    photos,
    progress,
    direction,
    offset,
    onPhotoClick,
}: {
    photos: string[];
    progress: MotionValue<number>;
    direction: "left" | "right";
    offset: number;
    onPhotoClick: (src: string) => void;
}) => {
    const reduce = useReducedMotion();
    const doubled = [...photos, ...photos];
    // Gentle travel across the whole pinned track — slower than before
    const x = useTransform(
        progress,
        [0, 1],
        direction === "left" ? [`${-4 - offset}%`, `${-20 - offset}%`] : [`${-20 - offset}%`, `${-4 - offset}%`],
    );
    return (
        <div className="flex overflow-hidden py-1 md:py-2">
            <motion.div className="flex flex-nowrap gap-3 md:gap-5" style={reduce ? undefined : { x }}>
                {doubled.map((src, i) => {
                    const num = PHOTOS.indexOf(src) + 1;
                    return (
                        <button
                            key={`${src}-${i}`}
                            type="button"
                            onClick={() => onPhotoClick(src)}
                            className={`group relative h-[140px] ${WIDTHS[(num + i) % WIDTHS.length]} flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border-4 border-transparent transition-all duration-500 hover:z-10 hover:scale-[1.04] hover:border-[var(--mk-pink)] hover:shadow-[0_25px_60px_-20px_rgba(247,65,128,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mk-pink)] md:h-[230px]`}
                        >
                            <img
                                src={src}
                                alt={`Dišpet merch fotografija ${num}`}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent transition-colors group-hover:from-black/10" />
                            <span className="mk-display absolute bottom-2.5 right-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] text-white/85 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
                                {String(num).padStart(2, "0")} / {PHOTOS.length}
                            </span>
                        </button>
                    );
                })}
            </motion.div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Per-product texture mapping (copied 1:1 from ShopScene tuning)     */
/* ------------------------------------------------------------------ */
type Zone = "front" | "back";
type ProductId = "tshirt" | "hoodie" | "cap" | "bottle";

const configureTexture = (tex: THREE.Texture, product: ProductId, zone: Zone) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.center.set(0.5, 0.5);
    if (zone === "front") {
        if (product === "hoodie") {
            tex.flipY = false;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(24.4, 24.4);
            tex.offset.set(0.21, -0.37);
        } else if (product === "cap") {
            tex.flipY = false;
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.repeat.set(7.28, 7.28);
            tex.offset.set(0, 0.78);
        } else if (product === "tshirt") {
            tex.flipY = true;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(3.4, -3.4);
            tex.offset.set(-1.05, 3.0);
        } else {
            // bottle
            tex.flipY = false;
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.repeat.set(6.25, 6.25);
            tex.offset.set(-0.3, 0.18);
        }
    } else {
        tex.flipY = false;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        if (product === "hoodie") {
            tex.repeat.set(-7.26, 7.26);
            tex.offset.set(-0.28, 1.9);
        } else if (product === "tshirt") {
            tex.repeat.set(5.31, 5.31);
            tex.offset.set(-0.25, 0.15);
        } else {
            tex.repeat.set(-1, 1);
            tex.offset.set(0, 0);
        }
    }
    tex.needsUpdate = true;
    return tex;
};

/* ------------------------------------------------------------------ */
/*  The act sequence — one product on stage at a time.                 */
/*  Every design appears exactly once across the whole show.           */
/* ------------------------------------------------------------------ */

interface ActSpec {
    id: ProductId;
    url: string;
    label: string;
    price: string;
    targetHeight: number;
    designZone: Zone;
    /** the model's required facing while on stage */
    faceBack: boolean;
    /** two unique designs for this act (never repeated elsewhere) */
    designs: [string, string];
    /** body colors for design A/B (tshirt+hoodie only — shop palette) */
    colors?: [string, string];
    staticColor?: string;
    /** where the model spins in from / spins out to (x, y) */
    enterDir: [number, number];
    exitDir: [number, number];
    /** spin direction multipliers for entry/exit */
    spinIn: number;
    spinOut: number;
    /** local act time of the design switch */
    switchAt: number;
}

const ACTS: ActSpec[] = [
    {
        id: "tshirt", url: "/models/tshirt_webshop.glb", label: "Dišpet majica", price: "30€",
        targetHeight: 2.9, designZone: "back", faceBack: true,
        designs: [fromGlob(streetGlob, "street-1.png"), fromGlob(streetGlob, "street-6.png")],
        colors: ["#231f20", "#e78fab"],
        enterDir: [9, 0.5], exitDir: [-9, 0.8], spinIn: 1, spinOut: -1,
        switchAt: 0.62, // first act starts during the lead-in, switch once fully pinned
    },
    {
        id: "hoodie", url: "/models/hoodie-webshop.glb", label: "Dišpet duksica", price: "50€",
        targetHeight: 3.1, designZone: "back", faceBack: true,
        designs: [fromGlob(streetGlob, "street-3.png"), fromGlob(streetGlob, "street-7.png")],
        colors: ["#387bbf", "#00ab98"],
        enterDir: [-9, -0.6], exitDir: [9, 0.6], spinIn: -1, spinOut: 1,
        switchAt: 0.55,
    },
    {
        id: "cap", url: "/models/cap_webshop.glb", label: "Dišpet kapa", price: "20€",
        targetHeight: 1.9, designZone: "front", faceBack: false,
        designs: [fromGlob(vintageGlob, "vintage-2.png"), fromGlob(logoGlob, "logo-5.png")],
        staticColor: "#231f20",
        enterDir: [2.5, 7], exitDir: [-9, -1], spinIn: 1, spinOut: 1,
        switchAt: 0.55,
    },
    {
        id: "bottle", url: "/models/bottle-webshop.glb", label: "Dišpet Termosica", price: "20€",
        targetHeight: 2.7, designZone: "front", faceBack: false,
        designs: [fromGlob(vintageGlob, "vintage-1.png"), fromGlob(vintageGlob, "vintage-4.png")],
        staticColor: "#ffffff",
        enterDir: [-2.5, -7], exitDir: [9, 1.2], spinIn: -1, spinOut: -1,
        switchAt: 0.55,
    },
];

/** Uneven act boundaries — act 1 gets extra room because it plays
 *  while the stage is still scrolling into view (early start). */
const BOUNDS = [0, 0.31, 0.54, 0.77, 1];

/* "Made with Dišpet" — three phrases typed out one after another,
   character by character, spanning the whole 3D show. */
const PHRASES = [
    { text: "100% hrvatski proizvod", cls: "mk-display text-2xl leading-tight text-white sm:text-3xl md:text-4xl" },
    { text: "— dizajnirano, tiskano i pakirano u Dalmaciji.", cls: "mk-display text-xl leading-snug mk-yellow sm:text-2xl md:text-3xl" },
    { text: "Made with Dišpet in Dalmatia.", cls: "mk-display text-2xl leading-tight text-white sm:text-3xl md:text-4xl" },
];
const PHRASE_WINDOWS: [number, number][] = [
    [0.02, 0.33],
    [0.35, 0.65],
    [0.67, 0.97],
];
/* the word "Dišpet" in the last phrase renders pink */
const PINK_FROM = PHRASES[2].text.indexOf("Dišpet");
const PINK_TO = PINK_FROM + "Dišpet".length;

/* ------------------------------------------------------------------ */
/*  Digital glitch — simplified port of the shop's print transition    */
/* ------------------------------------------------------------------ */

const injectGlitch = (mat: THREE.MeshStandardMaterial) => {
    mat.userData.uniforms = {
        uGlitch: { value: 0 },
        uTime: { value: 0 },
    };
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uGlitch = mat.userData.uniforms.uGlitch;
        shader.uniforms.uTime = mat.userData.uniforms.uTime;
        shader.vertexShader = shader.vertexShader
            .replace("#include <common>", "#include <common>\nvarying vec2 vGlitchUv;")
            .replace("#include <uv_vertex>", "#include <uv_vertex>\nvGlitchUv = uv;");
        shader.fragmentShader = shader.fragmentShader
            .replace(
                "#include <common>",
                `#include <common>
                uniform float uGlitch;
                uniform float uTime;
                varying vec2 vGlitchUv;
                float gRand(vec2 c) { return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); }`,
            )
            .replace(
                "#include <dithering_fragment>",
                `#include <dithering_fragment>
                if (uGlitch > 0.01) {
                    float g = uGlitch;
                    float row = floor(vGlitchUv.y * 28.0) + floor(uTime * 9.0);
                    float band = step(1.0 - g * 0.45, gRand(vec2(row, floor(uTime * 13.0))));
                    vec2 cell = floor(vGlitchUv * vec2(14.0, 9.0)) + floor(uTime * 7.0);
                    float block = step(1.0 - g * 0.3, gRand(cell));
                    vec3 holo = vec3(
                        0.5 + 0.5 * sin(uTime * 6.0),
                        0.5 + 0.5 * sin(uTime * 6.0 + 2.094),
                        0.5 + 0.5 * sin(uTime * 6.0 + 4.189));
                    gl_FragColor.rgb += holo * (band * 0.8 + block * 0.5) * g;
                    gl_FragColor.rgb = mix(gl_FragColor.rgb, holo, block * g * 0.35);
                    float scan = pow(0.5 + 0.5 * sin(vGlitchUv.y * 120.0 + uTime * 12.0), 2.0);
                    gl_FragColor.rgb += vec3(0.15, 0.4, 0.8) * scan * g * 0.3;
                    gl_FragColor.a *= 1.0 - band * g * 0.85;
                    if (g > 0.92) gl_FragColor.rgb += vec3((g - 0.92) * 6.0);
                }`,
            );
    };
};

/* ------------------------------------------------------------------ */
/*  Easing helpers (scrubbed — everything derives from scroll p)       */
/* ------------------------------------------------------------------ */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
const easeInOut = (t: number) => t * t * (3 - 2 * t);
/** bell curve centered at c with half-width w (0 outside, 1 at c) */
const bell = (t: number, c: number, w: number) => {
    const d = Math.abs(t - c);
    return d >= w ? 0 : 0.5 + 0.5 * Math.cos((d / w) * Math.PI);
};

const tmpColorA = new THREE.Color();
const tmpColorB = new THREE.Color();

/* ------------------------------------------------------------------ */
/*  One act (product) on the stage                                     */
/* ------------------------------------------------------------------ */

const ActModel = ({ act, index, progress, reduce }: {
    act: ActSpec;
    index: number;
    progress: MotionValue<number>;
    reduce: boolean;
}) => {
    const { scene } = useGLTF(act.url);
    const groupRef = useRef<THREE.Group>(null);

    const designTexRaw = useTexture(act.designs);
    const logoUrls = useMemo(
        () => (act.colors ? act.colors.map((c) => CODED_BY_COLOR[c]).filter(Boolean) : []),
        [act.colors],
    );
    const logoTexRaw = useTexture(logoUrls.length ? logoUrls : [act.designs[0]]);

    const designTex = useMemo(
        () => designTexRaw.map((t) => configureTexture(t.clone(), act.id, act.designZone)),
        [designTexRaw, act],
    );
    const logoTex = useMemo(
        () => (act.colors ? logoTexRaw.map((t) => configureTexture(t.clone(), act.id, "front")) : []),
        [logoTexRaw, act],
    );

    const { cloned, scale, bodyMats, designMats, logoMats } = useMemo(() => {
        const cloned = scene.clone(true);
        const bodyMats: THREE.MeshStandardMaterial[] = [];
        const designMats: THREE.MeshStandardMaterial[] = [];
        const logoMats: THREE.MeshStandardMaterial[] = [];

        cloned.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (!mesh.isMesh) return;
            const name = mesh.name.toLowerCase();
            const isPrint = name.includes("print");

            const remap = (m: THREE.Material) => {
                const mat = (m as THREE.MeshStandardMaterial).clone();
                if (isPrint) {
                    const zone: Zone = name.includes("back") ? "back" : "front";
                    mat.color.set("#ffffff");
                    mat.transparent = true;
                    mat.toneMapped = false;
                    mat.roughness = 1;
                    mat.metalness = 0;
                    mat.polygonOffset = true;
                    mat.polygonOffsetFactor = -1;
                    mat.polygonOffsetUnits = -1;
                    mat.depthWrite = false;
                    mesh.renderOrder = 1;
                    mat.map = null;
                    injectGlitch(mat);
                    if (zone === act.designZone) designMats.push(mat);
                    else logoMats.push(mat);
                } else {
                    if (!(mat.name || "").toLowerCase().includes("blackring")) {
                        bodyMats.push(mat);
                    }
                    mat.roughness = Math.max(0.7, mat.roughness);
                }
                return mat;
            };
            mesh.material = Array.isArray(mesh.material) ? mesh.material.map(remap) : remap(mesh.material);
        });

        const box = new THREE.Box3().setFromObject(cloned);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = act.targetHeight / maxDim;
        const center = box.getCenter(new THREE.Vector3());
        cloned.position.sub(center);
        return { cloned, scale, bodyMats, designMats, logoMats };
    }, [scene, act]);

    const lastIdx = useRef(-1);

    useFrame((state) => {
        const g = groupRef.current;
        if (!g) return;
        const segStart = BOUNDS[index];
        const segLen = BOUNDS[index + 1] - segStart;
        const p = reduce ? segStart + segLen * 0.4 : progress.get();

        // Local act time: 0 → spinning in, 1 → gone
        const t = (p - segStart) / segLen;
        const onStage = t > -0.03 && t < 1.03;
        g.visible = onStage;
        if (!onStage) return;
        const tc = clamp01(t);

        /* --- Choreography (all scrubbed by scroll) ---------------- */
        // 1) Spin in from this act's direction  (t 0 → 0.22)
        const inT = easeOutCubic(clamp01(tc / 0.22));
        // 2) Zoom toward the camera for the design switch (t 0.3 → 0.45)
        const zoomT = easeInOut(clamp01((tc - 0.3) / 0.15));
        // 3) Spin out toward the next act        (t 0.78 → 1)
        const outT = easeInCubic(clamp01((tc - 0.78) / 0.22));

        g.position.x = act.enterDir[0] * (1 - inT) + act.exitDir[0] * outT;
        g.position.y =
            act.enterDir[1] * (1 - inT) +
            act.exitDir[1] * outT +
            Math.sin(tc * Math.PI * 2.5) * 0.05;
        // closer to the lens while the design switches, hold it until the exit
        g.position.z = 2.1 * zoomT * (1 - outT);

        // Facing rule: hoodie/tshirt show their back, cap/bottle their front.
        // Entry adds two full spins that decay into the base facing;
        // exit accelerates back out. Tiny sway keeps the hold alive.
        const base = act.faceBack ? Math.PI : 0;
        g.rotation.y =
            base +
            act.spinIn * (1 - inT) * Math.PI * 4 +
            act.spinOut * outT * Math.PI * 4 +
            Math.sin(tc * Math.PI * 2) * 0.07;
        g.rotation.z = act.spinIn * (1 - inT) * 0.35 + act.spinOut * outT * -0.3;

        /* --- Design switch with glitch ----------------------------- */
        const glitch = bell(tc, act.switchAt, 0.12);
        const designIdx = tc < act.switchAt ? 0 : 1;

        if (designIdx !== lastIdx.current) {
            lastIdx.current = designIdx;
            const dTex = designTex[designIdx % designTex.length];
            designMats.forEach((m) => { m.map = dTex; m.needsUpdate = true; });
            if (act.colors && logoTex.length) {
                const lTex = logoTex[designIdx % logoTex.length];
                logoMats.forEach((m) => { m.map = lTex; m.needsUpdate = true; });
            }
        }

        const time = state.clock.elapsedTime;
        const setPrint = (m: THREE.MeshStandardMaterial) => {
            m.opacity = 1 - glitch * 0.3;
            if (m.userData.uniforms) {
                m.userData.uniforms.uGlitch.value = glitch;
                m.userData.uniforms.uTime.value = time;
            }
        };
        designMats.forEach(setPrint);
        logoMats.forEach(setPrint);

        /* --- Body color follows the active design ------------------ */
        if (act.colors) {
            const blend = bell(tc, act.switchAt, 0.05);
            tmpColorA.set(act.colors[0]);
            tmpColorB.set(act.colors[1]);
            const mixed = designIdx === 0 ? tmpColorA.lerp(tmpColorB, blend) : tmpColorB.lerp(tmpColorA, blend);
            bodyMats.forEach((m) => m.color.copy(mixed));
        } else if (act.staticColor) {
            bodyMats.forEach((m) => m.color.set(act.staticColor!));
        }
    });

    return (
        <group ref={groupRef} visible={false}>
            <group scale={scale}>
                <primitive object={cloned} />
            </group>
        </group>
    );
};

/* ------------------------------------------------------------------ */
/*  Stage — fits the single product into any viewport                  */
/* ------------------------------------------------------------------ */

const Stage = ({ progress, reduce }: { progress: MotionValue<number>; reduce: boolean }) => {
    const { viewport } = useThree();
    const s = Math.min(1, (viewport.width * 0.82) / 4.4);
    return (
        <group scale={s} position={[0, -0.1, 0]}>
            {ACTS.map((act, i) => (
                <ActModel key={act.id} act={act} index={i} progress={progress} reduce={reduce} />
            ))}
        </group>
    );
};

/* ------------------------------------------------------------------ */
/*  Public component — sticky scroll track with the photo gallery      */
/*  as a clickable underlay (two rows, 3D show floating in between)    */
/* ------------------------------------------------------------------ */

export const MerchShowcase3D = () => {
    const trackRef = useRef<HTMLDivElement>(null);
    const reduce = !!useReducedMotion();
    // "start 0.55": progress starts while the stage is still ~half a viewport
    // below — the first product is already spinning in as the stage arrives.
    const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 0.55", "end end"] });
    const { active: loading } = useProgress();

    const [actIdx, setActIdx] = useState(0);
    // Typewriter state: which phrase is on screen and how many characters
    // of it are revealed — both derived purely from scroll position.
    const [type, setType] = useState({ phase: -1, chars: 0 });
    useMotionValueEvent(scrollYProgress, "change", (p) => {
        const i = BOUNDS.findIndex((b, k) => k < BOUNDS.length - 1 && p >= b && p < BOUNDS[k + 1]);
        setActIdx(i === -1 ? ACTS.length - 1 : i);

        let phase = -1;
        let chars = 0;
        if (p > PHRASE_WINDOWS[PHRASE_WINDOWS.length - 1][1]) {
            phase = PHRASES.length - 1;
            chars = PHRASES[phase].text.length;
        } else {
            for (let k = 0; k < PHRASE_WINDOWS.length; k++) {
                const [a, b] = PHRASE_WINDOWS[k];
                if (p >= a && p <= b) {
                    phase = k;
                    const t = (p - a) / (b - a);
                    // type in over the first 35% of the window, hold after
                    const reveal = Math.min(1, t / 0.35);
                    chars = Math.round(reveal * PHRASES[k].text.length);
                    break;
                }
            }
        }
        setType((prev) => (prev.phase === phase && prev.chars === chars ? prev : { phase, chars }));
    });

    const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

    // Per-act label windows derived from the act boundaries
    const labelWindows = ACTS.map((_, i) => {
        const b0 = BOUNDS[i];
        const len = BOUNDS[i + 1] - b0;
        return [b0 + len * 0.1, b0 + len * 0.22, b0 + len * 0.78, b0 + len * 0.92];
    });
    /* eslint-disable react-hooks/rules-of-hooks -- ACTS is module-constant, hook order is stable */
    const labelOpacities = labelWindows.map((w) => useTransform(scrollYProgress, w, [0, 1, 1, 0]));
    const labelYs = labelWindows.map((w) => useTransform(scrollYProgress, w, [22, 0, 0, -22]));
    /* eslint-enable react-hooks/rules-of-hooks */

    // "Made with Dišpet" text — rides next to the model, swaying in sync
    // with the act boundaries and drifting across the whole track.
    const madeInY = useTransform(scrollYProgress, [0, 1], [34, -34]);
    const madeInX = useTransform(scrollYProgress, BOUNDS, [0, 14, -14, 14, 0]);

    /* ---------------- gallery lightbox ---------------- */
    const [selected, setSelected] = useState<number | null>(null);
    const openPhoto = (src: string) => setSelected(PHOTOS.indexOf(src));
    const next = useCallback(() => setSelected((p) => (p === null ? null : (p + 1) % PHOTOS.length)), []);
    const prev = useCallback(() => setSelected((p) => (p === null ? null : (p - 1 + PHOTOS.length) % PHOTOS.length)), []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (selected === null) return;
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "Escape") setSelected(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selected, next, prev]);

    const rowTop = PHOTOS.slice(0, 16);
    const rowBottom = PHOTOS.slice(16);

    return (
        <div ref={trackRef} className="relative h-[340vh]">
            <div className="sticky top-0 flex h-screen flex-col overflow-hidden">

                {/* LAYER 0 — photo gallery underlay: two tilted rows hugging the
                    stage edges (home-page marquee look), the middle stays open
                    for the 3D show. Cards remain clickable because the 3D layer
                    above ignores pointer events. */}
                <div
                    className="absolute -inset-x-[12%] inset-y-0 z-0 flex flex-col justify-center gap-[26vh] md:gap-[30vh]"
                    style={{ transform: "rotateZ(-5deg)" }}
                >
                    <GalleryRow photos={rowTop} progress={scrollYProgress} direction="left" offset={0} onPhotoClick={openPhoto} />
                    <GalleryRow photos={rowBottom} progress={scrollYProgress} direction="right" offset={5} onPhotoClick={openPhoto} />
                </div>
                {/* Soft veil so the 3D model reads clearly against the photos */}
                <div
                    className="pointer-events-none absolute inset-0 z-[1]"
                    style={{ background: "radial-gradient(ellipse at center, rgba(7,17,35,0.62) 18%, rgba(7,17,35,0.25) 55%, rgba(7,17,35,0.05) 80%)" }}
                />

                {/* LAYER 1 — the 3D show (click-through; only labels are interactive) */}
                <div
                    className="pointer-events-none relative z-10 min-h-0 flex-1"
                    role="img"
                    aria-label="3D prikaz proizvoda: Dišpet majica 30€, duksica 50€, kapa 20€, termosica 20€ — s izmjenom dizajna iz Dišpet kolekcija"
                >
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                            <div className="mk-display animate-pulse text-sm uppercase tracking-[0.3em] text-white/70">
                                Učitavanje 3D…
                            </div>
                        </div>
                    )}
                    <Canvas
                        camera={{ position: [0, 0.1, 8.5], fov: 35 }}
                        dpr={[1, 1.75]}
                        gl={{ antialias: true, alpha: true }}
                        style={{ background: "transparent", pointerEvents: "none" }}
                    >
                        <ambientLight intensity={0.55} />
                        <directionalLight position={[4, 6, 6]} intensity={1.1} />
                        <pointLight position={[-6, 2, -4]} intensity={0.4} color="#f74180" />
                        <pointLight position={[6, -2, -4]} intensity={0.4} color="#00c4c4" />
                        <Suspense fallback={null}>
                            <Stage progress={scrollYProgress} reduce={reduce} />
                            <Environment preset="city" />
                        </Suspense>
                    </Canvas>

                    {/* Made with Dišpet — one phrase at a time beside the model,
                        typed out character by character, scrubbed by scroll,
                        lasting the entire 3D show. */}
                    <motion.div
                        className="absolute left-5 top-[14%] z-10 max-w-[260px] drop-shadow-[0_6px_18px_rgba(0,0,0,0.85)] md:left-[6%] md:top-[34%] md:max-w-[360px]"
                        style={reduce ? undefined : { y: madeInY, x: madeInX }}
                        aria-label="100% hrvatski proizvod — dizajnirano, tiskano i pakirano u Dalmaciji. Made with Dišpet in Dalmatia."
                    >
                        {reduce ? (
                            <>
                                <p className={PHRASES[0].cls}>{PHRASES[0].text}</p>
                                <p className={`mt-2 ${PHRASES[1].cls}`}>{PHRASES[1].text}</p>
                                <p className={`mt-3 ${PHRASES[2].cls}`}>{PHRASES[2].text}</p>
                            </>
                        ) : (
                            <div className="relative min-h-[8rem]">
                                {PHRASES.map((ph, i) => {
                                    let charIdx = 0;
                                    const words = ph.text.split(" ");
                                    return (
                                        <p key={i} className={`absolute inset-x-0 top-0 ${ph.cls} ${type.phase === i ? "" : "invisible"}`} aria-hidden>
                                            {words.map((word, wi) => {
                                                const wordStart = charIdx;
                                                charIdx += word.length + 1; // + the following space
                                                return (
                                                    <span key={wi} className="inline-block whitespace-pre">
                                                        {word.split("").map((c, ci) => {
                                                            const k = wordStart + ci;
                                                            const shown = type.phase === i && k < type.chars;
                                                            const pink = i === 2 && k >= PINK_FROM && k < PINK_TO;
                                                            return (
                                                                <span
                                                                    key={ci}
                                                                    className={`inline-block transition-all duration-200 ${pink ? "mk-pink" : ""} ${shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
                                                                >
                                                                    {c}
                                                                </span>
                                                            );
                                                        })}
                                                        {wi < words.length - 1 ? " " : ""}
                                                    </span>
                                                );
                                            })}
                                        </p>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* Act labels — crossfade with each product, scrubbed.
                        Each label deep-links into the shop configurator. */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-40 z-10 md:bottom-[324px]">
                        <div className="relative mx-auto h-16 max-w-md drop-shadow-[0_6px_18px_rgba(0,0,0,0.85)]">
                            {ACTS.map((a, i) => (
                                <motion.div
                                    key={a.id}
                                    className="absolute inset-x-0 text-center"
                                    style={reduce ? (i === 0 ? undefined : { opacity: 0 }) : { opacity: labelOpacities[i], y: labelYs[i] }}
                                >
                                    <a
                                        href={shopUrl(a.id)}
                                        target="_blank"
                                        rel="noreferrer"
                                        tabIndex={i === actIdx ? 0 : -1}
                                        onClick={() => trackEvent("merch_product_click", { product: a.id, location: "3d_show" })}
                                        className="pointer-events-auto group inline-flex items-baseline gap-3 rounded-full px-4 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mk-pink)]"
                                    >
                                        <span className="mk-display text-2xl text-white transition group-hover:underline sm:text-3xl">{a.label}</span>
                                        <span className="mk-display text-xl mk-yellow sm:text-2xl">{a.price}</span>
                                        <span className="text-xs font-bold uppercase tracking-widest mk-pink opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
                                            Kupi →
                                        </span>
                                    </a>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* progress rail + act dots */}
                <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 mx-auto w-full max-w-md px-5 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] md:bottom-[260px]">
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div className="mk-rainbow h-full w-full origin-left" style={reduce ? undefined : { scaleX: railScale }} />
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2" aria-hidden>
                        {ACTS.map((a, i) => (
                            <span
                                key={a.id}
                                className={`h-2 w-2 rounded-full transition-colors duration-300 ${i === actIdx ? "bg-mk-pink" : "bg-white/20"}`}
                            />
                        ))}
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                            {ACTS[actIdx].label} · {actIdx + 1}/{ACTS.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selected !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-2 backdrop-blur-sm md:p-8"
                        onClick={() => setSelected(null)}
                    >
                        <button
                            type="button"
                            aria-label="Zatvori"
                            className="fixed right-4 top-4 z-[120] flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
                            onClick={(e) => { e.stopPropagation(); setSelected(null); }}
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <button
                            type="button"
                            aria-label="Prethodna"
                            className="fixed left-2 top-1/2 z-[120] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 md:left-8"
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            type="button"
                            aria-label="Sljedeća"
                            className="fixed right-2 top-1/2 z-[120] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 md:right-8"
                            onClick={(e) => { e.stopPropagation(); next(); }}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex h-full w-full flex-col items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selected !== null ? PHOTOS[selected] : ""}
                                alt="Dišpet merch fotografija"
                                className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
                            />
                            <div className="mt-4 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md">
                                {(selected ?? 0) + 1} / {PHOTOS.length}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

ACTS.forEach((a) => useGLTF.preload(a.url));

export default MerchShowcase3D;
