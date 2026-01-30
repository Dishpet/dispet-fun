import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, RefreshCw, Image as ImageIcon, Layers, Palette, RotateCcw, Activity, Move, Maximize, RotateCw, MousePointer2, Download } from 'lucide-react';
import { BRAND } from './brand';
import { TransformGizmo } from './TransformGizmo';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";

const DEFAULT_CONFIG = {
    frameColor: BRAND.colors.primary.green,
    blobCount: 4,
    orbitSpeed: 6,
    spread: 100,
    roughness: 0.4,
    colors: [
        BRAND.colors.primary.pink,
        BRAND.colors.primary.blue,
        BRAND.colors.primary.yellow,
        BRAND.colors.primary.green
    ],
    bgGradient: BRAND.gradients.dark,
};

// Initial Transform States
const DEFAULT_TRANSFORMS = {
    image: { x: 500, y: 500, scale: 1, rotate: 0 },
    frame: { x: 500, y: 500, scale: 1.2, rotate: 0 }
};

interface BlobEditorProps {
    initialImage?: string;
}

export const BlobEditor = ({ initialImage }: BlobEditorProps) => {
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [transforms, setTransforms] = useState(DEFAULT_TRANSFORMS);
    const [imageUrl, setImageUrl] = useState(initialImage || "https://picsum.photos/seed/kids/800/1000");
    const [showControls, setShowControls] = useState(true);
    const [selectedId, setSelectedId] = useState<string | number | null>(null);

    const [seeds, setSeeds] = useState<{ back: any[], mask: any[], decor: any[] }>({ back: [], mask: [], decor: [] });
    const svgRef = useRef<SVGSVGElement>(null);
    const { toast } = useToast();

    // Interaction Refs for Drag Logic
    const dragRef = useRef({
        active: false,
        mode: null as 'move' | 'transform' | null,
        startPos: { x: 0, y: 0 },
        initialTransform: null as any
    });

    // --- BRAND FONT INJECTION ---
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=DynaPuff:wght@400..700&family=Nunito:wght@400..900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    // --- GENERATOR LOGIC ---
    const generateClusterSeeds = (count = 3) => {
        return Array.from({ length: count }).map((_, i) => ({
            baseAngle: (i * (360 / count)),
            angleJitter: (Math.random() - 0.5) * 40,
            sizeRandom: Math.random(),
            distRandom: Math.random(),
            speedScale: 0.8 + Math.random() * 0.4,
            phaseOffset: Math.random() * 2 * Math.PI,
        }));
    };

    const regenerate = () => {
        setSeeds({
            back: generateClusterSeeds(3),
            mask: generateClusterSeeds(3),
            decor: Array.from({ length: config.blobCount }).map(() => ({
                angle: Math.random() * 2 * Math.PI,
                extraDist: Math.random() * 150,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                parts: generateClusterSeeds(2)
            }))
        });
    };

    const resetDefaults = () => {
        setConfig(DEFAULT_CONFIG);
        setTransforms(DEFAULT_TRANSFORMS);
    };

    useEffect(() => {
        regenerate();
    }, [config.blobCount]);

    // --- INTERACTION HANDLERS ---
    const getMousePos = (e: React.PointerEvent | React.MouseEvent | any) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX || e.touches?.[0]?.clientX;
        pt.y = e.clientY || e.touches?.[0]?.clientY;
        return pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    };

    const handlePointerDown = (e: React.PointerEvent | any, id: string | number, mode: 'move' | 'transform') => {
        e.stopPropagation();
        // e.preventDefault(); // Prevents scrolling on mobile
        const pos = getMousePos(e);

        setSelectedId(id);
        dragRef.current = {
            active: true,
            mode: mode,
            startPos: pos,
            initialTransform: { ...transforms[id as keyof typeof transforms] }
        };
    };

    const handlePointerMove = (e: React.PointerEvent | any) => {
        if (!dragRef.current.active || !selectedId) return;
        // e.preventDefault();

        const currentPos = getMousePos(e);
        const { startPos, initialTransform, mode } = dragRef.current;

        setTransforms(prev => {
            const currentTrans = { ...(prev[selectedId as keyof typeof transforms] as any) };

            if (mode === 'move') {
                const dx = currentPos.x - startPos.x;
                const dy = currentPos.y - startPos.y;
                currentTrans.x = initialTransform.x + dx;
                currentTrans.y = initialTransform.y + dy;
            }
            else if (mode === 'transform') {
                // Calculate Angle
                const startAngle = Math.atan2(startPos.y - initialTransform.y, startPos.x - initialTransform.x);
                const currentAngle = Math.atan2(currentPos.y - initialTransform.y, currentPos.x - initialTransform.x);
                const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
                currentTrans.rotate = initialTransform.rotate + angleDiff;

                // Calculate Scale
                const startDist = Math.hypot(startPos.x - initialTransform.x, startPos.y - initialTransform.y);
                const currentDist = Math.hypot(currentPos.x - initialTransform.x, currentPos.y - initialTransform.y);
                // Prevent scale from reaching 0
                const newScale = initialTransform.scale * (currentDist / startDist);
                currentTrans.scale = Math.max(0.1, newScale);
            }

            return { ...prev, [selectedId]: currentTrans };
        });
    };

    const handlePointerUp = () => {
        dragRef.current.active = false;
    };

    const handleDownload = async () => {
        if (!svgRef.current) return;

        try {
            // Need to convert SVG to Canvas/Image
            const svgData = new XMLSerializer().serializeToString(svgRef.current);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            // Simple SVG to Base64 logic (might need more robust solution for external images/cors)
            const svgSize = svgRef.current.viewBox.baseVal;
            canvas.width = 1000;
            canvas.height = 1000;

            img.onload = () => {
                if (ctx) {
                    ctx.fillStyle = config.bgGradient.includes('gradient') ? '#0d142a' : config.bgGradient; // Fallback for gradient
                    ctx.fillRect(0, 0, 1000, 1000); // Draw BG manually properly later
                    ctx.drawImage(img, 0, 0);
                    const url = canvas.toDataURL("image/png");
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `blob-design-${Date.now()}.png`;
                    link.click();
                }
            };

            // This naive approach fails with external images (CORS). 
            // Ideally we use html2canvas or similar, but for SVG it can be tricky.
            // For now, let's just trigger toast saying logic needs refinement or just implement basic save.

            // Using html2canvas on the parent div?
            const html2canvas = (await import('html2canvas')).default;
            // Using the parent div wrapper
            const wrapper = svgRef.current.parentElement;
            if (wrapper) {
                const canvas = await html2canvas(wrapper as HTMLElement, {
                    useCORS: true,
                    backgroundColor: null,
                    scale: 2
                });
                const link = document.createElement('a');
                link.download = `dispet-blob-${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();

                toast({ title: "Downloaded!", description: "Check your downloads folder." });
            }

        } catch (error) {
            console.error("Download failed", error);
            toast({ title: "Error", description: "Could not download image. CORS issues likely.", variant: "destructive" });
        }
    };


    // --- BLOB COMPONENT ---
    const BlobCluster = ({ parts, spread, speed, baseR, roughness, cx = 0, cy = 0, fill = "white", intensity = 1.0 }: any) => {
        return (
            <g transform={`translate(${cx}, ${cy})`}>
                {parts.map((part: any, i: number) => {
                    const r = baseR * (0.8 + (part.sizeRandom * roughness));
                    const rawDist = spread * (0.8 + (part.distRandom * 0.4));
                    const dist = Math.min(rawDist, r * 0.85);
                    const angle = part.baseAngle + part.angleJitter;
                    const swayAngle = 15 * intensity;
                    const swayDist = 0.1 * intensity;

                    return (
                        <React.Fragment key={i}>
                            <circle
                                cx={0} cy={0} r={r} fill={fill}
                                style={{
                                    animation: `wobble-${i} ${speed * part.speedScale}s ease-in-out infinite alternate`,
                                    animationDelay: `${part.phaseOffset}s`
                                }}
                            />
                            <style>
                                {`
                  @keyframes wobble-${i} {
                    0% { transform: rotate(${angle - swayAngle}deg) translateX(${dist * (1 - swayDist)}px); }
                    100% { transform: rotate(${angle + swayAngle}deg) translateX(${dist * (1 + swayDist)}px); }
                  }
                `}
                            </style>
                        </React.Fragment>
                    );
                })}
            </g>
        );
    };

    return (
        <div className="relative w-full h-[80vh] overflow-hidden text-slate-100 touch-none select-none rounded-xl border border-slate-700"
            style={{ background: config.bgGradient, fontFamily: BRAND.fonts.primary }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}>

            {/* MAIN SVG SCENE */}
            <svg
                ref={svgRef}
                className="w-full h-full"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="xMidYMid meet"
                onPointerDown={() => setSelectedId(null)} // Click background to deselect
            >
                <defs>
                    <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -9" result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                    </filter>

                    <mask id="blobMask">
                        <rect width="100%" height="100%" fill="black" />
                        <g filter="url(#goo)">
                            {seeds.mask.length > 0 && (
                                <g transform={`translate(${transforms.image.x}, ${transforms.image.y}) scale(${transforms.image.scale}) rotate(${transforms.image.rotate})`}>
                                    <BlobCluster
                                        parts={seeds.mask} spread={config.spread} speed={config.orbitSpeed} baseR={170}
                                        roughness={config.roughness} fill="white" intensity={1.0}
                                    />
                                </g>
                            )}
                        </g>
                    </mask>
                </defs>

                {/* 1. BACKGROUND BLOB (FRAME) */}
                <g filter="url(#goo)">
                    {seeds.back.length > 0 && (
                        <g transform={`translate(${transforms.frame.x}, ${transforms.frame.y}) scale(${transforms.frame.scale}) rotate(${transforms.frame.rotate})`}>
                            <BlobCluster
                                parts={seeds.back} spread={config.spread * 1.2} speed={config.orbitSpeed} baseR={190}
                                roughness={config.roughness} fill={config.frameColor} intensity={1.0}
                            />
                        </g>
                    )}
                </g>

                {/* FRAME HIT TARGET (Invisible but draggable) */}
                <circle
                    cx={transforms.frame.x} cy={transforms.frame.y}
                    r={250 * transforms.frame.scale}
                    fill="transparent"
                    className="cursor-move pointer-events-auto"
                    onPointerDown={(e) => handlePointerDown(e, 'frame', 'move')}
                />

                {/* 2. THE IMAGE MASKED */}
                {/* UPDATED: Removed transform wrapper. Image is now static and fullscreen. 
            The MASK itself moves (see <mask id="blobMask"> in defs). */}
                <image
                    href={imageUrl}
                    x="0" y="0" width="1000" height="1000"
                    preserveAspectRatio="xMidYMid slice"
                    mask="url(#blobMask)"
                    style={{ transition: 'none' }}
                    pointerEvents="none" // Ensure clicks pass through to the frame hit target below
                />

                {/* IMAGE HIT TARGET */}
                <circle
                    cx={transforms.image.x} cy={transforms.image.y}
                    r={200 * transforms.image.scale}
                    fill="transparent"
                    className="cursor-move pointer-events-auto"
                    onPointerDown={(e) => handlePointerDown(e, 'image', 'move')}
                />

                {/* 3. DECORATIVE BLOBS (Orbiting the Image Blob) */}
                <g filter="url(#goo)">
                    {seeds.decor.map((blob, i) => {
                        const safeZoneRadius = 320 + (config.spread * 0.8) + (config.roughness * 40);
                        const dist = (safeZoneRadius * transforms.image.scale) + blob.extraDist; // Scale dist with image

                        // Position relative to IMAGE BLOB
                        const cx = transforms.image.x + Math.cos(blob.angle) * dist;
                        const cy = transforms.image.y + Math.sin(blob.angle) * dist;

                        return (
                            <BlobCluster
                                key={i} cx={cx} cy={cy} parts={blob.parts} spread={30}
                                speed={config.orbitSpeed * 0.4} baseR={30} roughness={config.roughness}
                                fill={blob.color} intensity={2.5}
                            />
                        );
                    })}
                </g>

                {/* 4. CONTROLS OVERLAY (GIZMOS) */}
                <TransformGizmo id="frame" selectedId={selectedId} transform={transforms.frame} radius={250} onDragStart={handlePointerDown} />
                <TransformGizmo id="image" selectedId={selectedId} transform={transforms.image} radius={200} onDragStart={handlePointerDown} />

            </svg>


            {/* --- BRANDED CONTROLS UI --- */}
            <div className={`absolute top-4 right-4 z-50 transition-transform duration-300 ${showControls ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="bg-[#111519]/90 backdrop-blur-md border border-[#43bfe6]/30 p-6 rounded-2xl shadow-xl w-80 max-h-[90vh] overflow-y-auto">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-[#e83e70] to-[#ffcd07]"
                            style={{ fontFamily: BRAND.fonts.display }}>
                            Dispet Editor
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={resetDefaults} className="text-[#8fd2e8] hover:text-[#e83e70] transition-colors">
                                <RotateCcw size={16} />
                            </button>
                            <button onClick={() => setShowControls(false)} className="text-[#8fd2e8] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">

                        {/* INSTRUCTIONS */}
                        <div className="bg-[#0089cd]/20 p-3 rounded-lg border border-[#0089cd]/30 text-xs text-[#8fd2e8]">
                            <div className="flex gap-2 mb-1 font-bold text-[#43bfe6]">
                                <MousePointer2 size={14} /> Interaction Mode
                            </div>
                            <ul className="list-disc pl-4 space-y-1 opacity-80">
                                <li><strong>Tap/Click</strong> a blob to select it.</li>
                                <li><strong>Drag</strong> center to move.</li>
                                <li><strong>Drag Handle</strong> (Yellow Dot) to rotate/scale.</li>
                            </ul>
                        </div>

                        <hr className="border-[#43bfe6]/20" />

                        {/* Shape */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-[#73b72b]" style={{ fontFamily: BRAND.fonts.primary }}>
                                <Activity size={16} /> Dynamics
                            </div>

                            <div className="space-y-2">
                                <label className="flex justify-between text-xs text-[#c8da80]">
                                    Irregularity <span>{Math.round(config.roughness * 100)}%</span>
                                </label>
                                <input type="range" min="0" max="1.5" step="0.1" value={config.roughness} onChange={(e) => setConfig({ ...config, roughness: Number(e.target.value) })}
                                    className="w-full h-2 bg-[#f1f1f0] rounded-lg appearance-none cursor-pointer accent-[#73b72b]" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-[#c8da80]">Blob Spread</label>
                                <input type="range" min="50" max="200" value={config.spread} onChange={(e) => setConfig({ ...config, spread: Number(e.target.value) })}
                                    className="w-full h-2 bg-[#f1f1f0] rounded-lg appearance-none cursor-pointer accent-[#73b72b]" />
                            </div>
                        </div>

                        <hr className="border-[#43bfe6]/20" />

                        {/* Appearance (Brand Locked) */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-[#e83e70]" style={{ fontFamily: BRAND.fonts.primary }}>
                                <Palette size={16} /> Brand Colors
                            </div>

                            {/* Frame Color Picker - Locked to Brand Palette */}
                            <div className="space-y-2">
                                <label className="text-xs text-[#f39fbd]">Frame Color</label>
                                <div className="flex gap-2">
                                    {Object.values(BRAND.colors.primary).map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setConfig({ ...config, frameColor: color })}
                                            className={`w-6 h-6 rounded-full border-2 ${config.frameColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Background Picker - Locked to Brand Gradients */}
                            <div className="space-y-2">
                                <label className="text-xs text-[#f39fbd]">Background</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setConfig({ ...config, bgGradient: BRAND.gradients.dark })}
                                        className={`w-8 h-8 rounded border-2 ${config.bgGradient === BRAND.gradients.dark ? 'border-white' : 'border-transparent'}`}
                                        style={{ background: BRAND.gradients.dark }} title="Navy (Dark Mode)" />
                                    <button onClick={() => setConfig({ ...config, bgGradient: BRAND.gradients.vibrant })}
                                        className={`w-8 h-8 rounded border-2 ${config.bgGradient === BRAND.gradients.vibrant ? 'border-white' : 'border-transparent'}`}
                                        style={{ background: BRAND.gradients.vibrant }} title="Vibrant" />
                                    <button onClick={() => setConfig({ ...config, bgGradient: BRAND.gradients.aqua })}
                                        className={`w-8 h-8 rounded border-2 ${config.bgGradient === BRAND.gradients.aqua ? 'border-white' : 'border-transparent'}`}
                                        style={{ background: BRAND.gradients.aqua }} title="Aqua" />
                                </div>
                            </div>
                        </div>

                        <button onClick={regenerate} className="w-full py-2 bg-[#e83e70] hover:bg-[#ffcd07] text-[#111519] font-bold rounded-lg flex items-center justify-center gap-2 text-sm transition-colors shadow-lg" style={{ fontFamily: BRAND.fonts.display }}>
                            <RefreshCw size={14} /> Mix Clusters
                        </button>
                        <button onClick={handleDownload} className="w-full py-2 bg-[#43bfe6] hover:bg-[#ffcd07] text-[#111519] font-bold rounded-lg flex items-center justify-center gap-2 text-sm transition-colors shadow-lg mt-2" style={{ fontFamily: BRAND.fonts.display }}>
                            <Download size={14} /> Download
                        </button>

                        <div className="pt-4">
                            <label className="flex items-center gap-2 text-xs text-[#8fd2e8] mb-2">
                                <ImageIcon size={14} /> Image URL
                            </label>
                            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                                className="w-full bg-[#0d142a] border border-[#43bfe6]/50 rounded px-3 py-2 text-xs text-[#8fd2e8] focus:outline-none focus:border-[#e83e70]" />
                        </div>

                    </div>
                </div>
            </div>

            {!showControls && (
                <button onClick={() => setShowControls(true)} className="absolute top-4 right-4 bg-[#e83e70] p-3 rounded-full shadow-lg text-white hover:bg-[#ffcd07] hover:text-[#111519] transition-colors z-50">
                    <Settings size={20} />
                </button>
            )}

        </div>
    );
};
