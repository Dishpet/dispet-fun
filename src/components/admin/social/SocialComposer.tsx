import { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Text, Image as ImageIcon, Type, Trash2, Wand2, Download, UserRound, Sparkles, Loader2 } from "lucide-react";
import { SocialTemplate } from "./SocialTemplateSelector";
import { removeBlackBackground } from "@/utils/imageUtils";
import { toast } from "sonner";
import { generateImageWithGemini } from "@/integrations/gemini/client";
import { styles } from "@/components/StyleSelector";
import { cn } from "@/lib/utils";

// Reference images for Roko character generation
import rokoCasual from "@/assets/roko-casual.png";    // Casual - no logo
import rokoSport from "@/assets/roko-sport.png";      // Sporty/Dres
import rokoHead from "@/assets/roko-head.png";        // Headshot/Face

interface SocialComposerProps {
    template: SocialTemplate;
    onBack: () => void;
}

interface ComposerLayer {
    id: string;
    type: 'text' | 'image';
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    fontFamily?: 'DynaPuff' | 'Nunito';
    color?: string;
    rotation?: number;
    zIndex: number;
}

export const SocialComposer = ({ template, onBack }: SocialComposerProps) => {
    const [layers, setLayers] = useState<ComposerLayer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Roko AI Settings
    const [includeRoko, setIncludeRoko] = useState(true);
    const [rokoPrompt, setRokoPrompt] = useState("");

    // Style Selection
    const [selectedStyle, setSelectedStyle] = useState("cartoon");

    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Scale
    const [scale, setScale] = useState(0.5);

    useEffect(() => {
        setScale(0.6);
    }, []);

    // Helper: Convert image URL to base64
    const imageUrlToBase64 = async (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    };

    const handleGenerateBackground = async () => {
        setIsGenerating(true);
        toast.info("Nano Banana Pro is designing your post...");

        try {
            // 1. Prepare References - Convert to base64
            // IMPORTANT: rokoHead (headshot) is FIRST - this is the most important facial reference
            console.log("🖼️ Converting reference images to base64...");

            // Only 3 reference images: HEADSHOT + body/outfit refs
            const referenceUrls = [rokoHead, rokoCasual, rokoSport];

            // Convert all reference URLs to base64
            const references = await Promise.all(
                referenceUrls.map(url => imageUrlToBase64(url))
            );
            console.log(`✅ Converted ${references.length} reference images to base64 (Headshot first)`);

            // 2. Get style-specific instructions
            const styleInfo = styles.find(s => s.id === selectedStyle);
            const styleName = styleInfo?.name || "Cartoon";
            const dimensions = `${template.width}x${template.height}`;
            const aspectRatio = template.width > template.height ? "landscape" : template.width < template.height ? "portrait" : "square";
            const userAction = rokoPrompt || "striking a fun, energetic pose, looking happy and playful";

            // Integrated Character Reference Instruction
            const charRefInfo = `
🎭 MASCOT CHARACTER "ROKO":
⚠️ MOST CRITICAL: The character's EXACT appearance is provided in the attached 3 reference images. 
📸 IMAGE 1 is the FACE reference. IMAGES 2-3 are for character/outfit reference.
Copy EXACT facial features from IMAGE 1 (Headshot). The face is the character's identity - get it EXACTLY right.
🚫 IMPORTANT: DO NOT include any shop logos, text emblems, or specific branding designs (like logo-5) that may be visible in the reference images. The character should have CLEAN clothing without any specific shop designs.
DO NOT use generic animal data. Roko is a character exactly as shown in references.
            `;

            const STYLE_PROMPTS: Record<string, string> = {
                "no-style": `Create a high-resolution version of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Focus purely on the character's likeness and the requested action.

${charRefInfo}`,

                anime: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Use clean vector shapes, bold outlines, energetic anime effects, cel-shaded coloring, motion streaks, and vibrant color accents.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to premium streetwear, character-based graphics, or modern pop-anime poster styles.

ANIME STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• Anime-style effects, speed lines, glow accents`,

                synthwave: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Use clean vector shapes, bold outlines, neon gradients, retro 80s colors, gridlines, glowing geometric fragments, and synthwave sun elements.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to premium streetwear, neon-retro artwork, or modern synthwave poster design.

SYNTHWAVE STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• Neon, chrome, and synthwave design elements`,

                gta: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Use clean vector shapes, bold outlines, flat comic-cell shading, sharp color blocks, and minimal background elements inspired by GTA loading screen artwork.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to premium streetwear or stylized GTA poster graphics.

GTA STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• GTA-style shading, poster elements, and color blocking
• Balanced contrast and strong outlines`,

                cyberpunk: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Use clean vector shapes, bold outlines, holographic glows, neon lighting, electric fragments, cybernetic accents, and futuristic color palettes.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to futuristic streetwear or modern neon cyberpunk posters.

CYBERPUNK STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• Cyberpunk neon, holographic shapes, electric effects`,

                cartoon: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Use clean vector shapes, bold outlines, playful cartoon features, graffiti splashes, fun geometric fragments, and colorful dynamic highlights.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to premium mascot logos or modern cartoon streetwear graphics.

CARTOON MASCOT STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• Cartoon-style exaggeration, graffiti accents`,

                "3d": `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Use clean vector-inspired 3D shapes, bold outlines, soft cinematic lighting, glossy materials, and stylized shading.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to collectible 3D figurines or stylized 3D streetwear graphics.

3D STYLIZED STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• Stylized 3D lighting and smooth materials`,

                retro: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Use clean vector shapes, bold outlines, muted retro color palettes, halftone textures, and vintage geometric fragments.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics inspired by classic vintage posters and retro streetwear.

RETRO / VINTAGE STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• Retro halftones, muted colors, vintage poster shapes`,

                inkpunk: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Use clean vector shapes, bold outlines, aggressive ink strokes, splashes, neon drips, expressive brush fragments, and chaotic graffiti elements.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics inspired by expressive inkpunk and street-art fusion posters.

INKPUNK STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• Ink strokes, splatters, drips, neon graffiti chaos`,

                steampunk: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Use clean vector shapes, bold outlines, brass and copper tones, gears, goggles, mechanical fragments, and Victorian-inspired steampunk design elements.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to premium steampunk fashion and mechanical poster art.

STEAMPUNK STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• Steampunk gears, pipes, goggles, metallic textures`,

                noir: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Use clean vector shapes, bold outlines, heavy noir shadows, moody lighting, limited palette (black, white, red), and gritty comic-style textures.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics inspired by noir graphic novels and dark comic posters.

NOIR / DARK COMIC STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• Noir shadows, dramatic lighting, gritty comic shading`,

                fantasy: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Use clean vector shapes, bold outlines, magical glows, enchanted particles, ornate fantasy fragments, and dramatic lighting.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to heroic fantasy posters and RPG character art.

FANTASY / RPG STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• Magical particles, glowing runes, fantasy lighting`,

                minimalist: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Use clean geometric vector shapes, bold outlines, smooth curves, limited color palette, and modern design fragments.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to minimalist vector posters and premium logo-style art.

MINIMALIST MODERN VECTOR STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• Minimal geometric shapes, clean flat colors`,

                "abstract-geometry": `Create a stunning, high-resolution social media illustration of the mascot character (ROKO) ${userAction} in a ${aspectRatio} format (${dimensions}). Surround the mascot character with a dynamic explosion of abstract shapes, colorful liquid splashes, sharp geometric fragments, stars, and vibrant decorative particles. Style reference: explosive, colorful, high-contrast liquid-geometric fusion. 

The design should have a clear silhouette and strong central composition suitable for social media.

ABSTRACT SHAPES & GEOMETRY STYLE
${charRefInfo}

Design requirements:
• ${aspectRatio} format (${dimensions})
• Abstract geometric fragments, shards, and layered shapes`,
            };

            const prompt = STYLE_PROMPTS[selectedStyle] || STYLE_PROMPTS.cartoon;

            // Header for every prompt
            const fullPrompt = `You are a professional social media designer.\n\n${prompt}\n\n⚠️ IMPORTANT:\n- Output dimensions: ${dimensions}\n- Maintain professional composition suitable for social media text overlays`;

            // 4. Call Gemini with enhanced prompt
            const resultBase64 = await generateImageWithGemini(fullPrompt, "{prompt}", references);

            setBgImage(resultBase64);
            toast.success("Background Generated!");
        } catch (error) {
            console.error("Generation failed:", error);
            toast.error("Failed to generate design. Try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const addTextLayer = () => {
        if (!bgImage) {
            toast.error("Generate a design first!");
            return;
        }
        const newLayer: ComposerLayer = {
            id: crypto.randomUUID(),
            type: 'text',
            content: "New Text",
            x: 50,
            y: 50,
            width: 300,
            height: 100,
            fontSize: 48,
            fontFamily: 'DynaPuff',
            color: '#FFFFFF',
            zIndex: layers.length + 2
        };
        setLayers([...layers, newLayer]);
        setSelectedLayerId(newLayer.id);
    };

    const addImageLayer = (url: string) => {
        const newLayer: ComposerLayer = {
            id: crypto.randomUUID(),
            type: 'image',
            content: url,
            x: 100,
            y: 100,
            width: 400,
            height: 400,
            zIndex: layers.length + 2
        };
        setLayers([...layers, newLayer]);
        setSelectedLayerId(newLayer.id);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // FIXED: Removed blocking logic here entirely to allow uploads
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                addImageLayer(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const updateLayer = (id: string, updates: Partial<ComposerLayer>) => {
        setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const removeLayer = (id: string) => {
        setLayers(layers.filter(l => l.id !== id));
        if (selectedLayerId === id) setSelectedLayerId(null);
    };

    const selectedLayer = layers.find(l => l.id === selectedLayerId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">

            {/* Toolbar / Controls */}
            <div className="lg:col-span-1 border rounded-xl bg-white p-4 space-y-6 overflow-y-auto shadow-sm h-full flex flex-col">

                {/* 1. Generator Controls (Top) */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border">
                    <h3 className="font-bold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Design Generator
                    </h3>

                    <div className="space-y-2">
                        <Textarea
                            placeholder="What should Roko do? (e.g. playing guitar)"
                            className="h-20 text-xs resize-none bg-white font-sans"
                            value={rokoPrompt}
                            onChange={(e) => setRokoPrompt(e.target.value)}
                        />
                        <div className="flex gap-1 justify-center opacity-70">
                            <img src={rokoHead} className="w-6 h-6 rounded-full border bg-white object-contain" title="Headshot" />
                            <img src={rokoCasual} className="h-6 w-6 rounded-full border bg-white object-contain" title="Casual" />
                            <img src={rokoSport} className="w-6 h-6 rounded-full border bg-white object-contain" title="Sport" />
                        </div>
                    </div>

                    {/* Style Picker */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Style</Label>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            {styles.map((style) => {
                                const isSelected = selectedStyle === style.id;
                                return (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedStyle(style.id)}
                                        className={cn(
                                            "relative min-w-[48px] h-[48px] rounded-lg overflow-hidden border-2 transition-all hover:scale-105 flex-shrink-0",
                                            isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/50"
                                        )}
                                        title={style.name}
                                    >
                                        <img src={style.image} alt={style.name} className="w-full h-full object-cover" />
                                        <div className={cn(
                                            "absolute inset-0 bg-black/40 transition-opacity",
                                            isSelected ? "opacity-10" : "opacity-40"
                                        )} />
                                        {isSelected && (
                                            <div className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full bg-primary flex items-center justify-center">
                                                <div className="h-1 w-1 rounded-full bg-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center">{styles.find(s => s.id === selectedStyle)?.name}</p>
                    </div>

                    <Button
                        className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-bold shadow-md"
                        onClick={handleGenerateBackground}
                        disabled={isGenerating}
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                        Generate Design
                    </Button>
                </div>

                {/* 2. Composition Tools */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg">Add Elements</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            onClick={addTextLayer}
                            variant="outline"
                            className="justify-start"
                            disabled={!bgImage}
                            title={!bgImage ? "Generate a design first" : "Add Text Layer"}
                        >
                            <Type className="w-4 h-4 mr-2" /> Text
                        </Button>
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="justify-start"
                            disabled={includeRoko}
                            title={includeRoko ? "Roko is being generated" : "Upload Image"}
                        >
                            <ImageIcon className="w-4 h-4 mr-2" /> Image
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                    </div>
                    {!bgImage && (
                        <p className="text-xs text-muted-foreground">
                            * Generating a design unlocks text tools.
                        </p>
                    )}
                </div>

                {/* Layer Editor */}
                {selectedLayer && (
                    <div className="space-y-4 border-t pt-4 flex-1">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-sm">Edit Layer</h4>
                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeLayer(selectedLayer.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        {selectedLayer.type === 'text' && (
                            <>
                                <Input value={selectedLayer.content} onChange={(e) => updateLayer(selectedLayer.id, { content: e.target.value })} />
                                <div className="flex gap-2">
                                    <Button size="sm" variant={selectedLayer.fontFamily === 'DynaPuff' ? 'default' : 'outline'} onClick={() => updateLayer(selectedLayer.id, { fontFamily: 'DynaPuff' })}>DynaPuff</Button>
                                    <Button size="sm" variant={selectedLayer.fontFamily === 'Nunito' ? 'default' : 'outline'} onClick={() => updateLayer(selectedLayer.id, { fontFamily: 'Nunito' })}>Nunito</Button>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {['#000000', '#FFFFFF', '#FFD700', '#FF0055', '#3b82f6'].map(c => (
                                        <div key={c} className={`w-6 h-6 rounded-full cursor-pointer border ${selectedLayer.color === c ? 'ring-2 ring-primary' : ''}`} style={{ backgroundColor: c }} onClick={() => updateLayer(selectedLayer.id, { color: c })} />
                                    ))}
                                </div>
                                <Slider value={[selectedLayer.fontSize || 16]} min={12} max={200} onValueChange={([v]) => updateLayer(selectedLayer.id, { fontSize: v })} />
                            </>
                        )}
                        {selectedLayer.type === 'image' && (
                            <div className="text-xs text-muted-foreground">
                                Drag corners to resize. Drag image to move.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Canvas Area */}
            <div className="lg:col-span-3 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center p-8 relative">
                <div
                    ref={containerRef}
                    className="bg-white shadow-2xl relative overflow-hidden transition-all"
                    style={{ width: template.width * scale, height: template.height * scale }}
                    onClick={() => setSelectedLayerId(null)}
                >
                    {/* Background Layer */}
                    {bgImage ? (
                        <img src={bgImage} className="absolute inset-0 w-full h-full object-cover" alt="Generated Design" />
                    ) : (
                        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 flex-col gap-2">
                            <Wand2 className="w-12 h-12 opacity-20" />
                            <p>Generate a design to start</p>
                            <p className="text-xs opacity-50">{template.width} x {template.height}</p>
                        </div>
                    )}

                    {/* Layers */}
                    {layers.map(layer => (
                        <Rnd
                            key={layer.id}
                            size={{ width: layer.width * scale, height: layer.height * scale }}
                            position={{ x: layer.x * scale, y: layer.y * scale }}
                            onDragStop={(e, d) => updateLayer(layer.id, { x: d.x / scale, y: d.y / scale })}
                            onResizeStop={(e, direction, ref, delta, position) => updateLayer(layer.id, {
                                width: parseInt(ref.style.width) / scale,
                                height: parseInt(ref.style.height) / scale,
                                x: position.x / scale,
                                y: position.y / scale
                            })}
                            onDragStart={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                            onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                            bounds="parent"
                            style={{ zIndex: layer.zIndex, border: selectedLayerId === layer.id ? '2px solid #3b82f6' : 'none' }}
                        >
                            {layer.type === 'text' ? (
                                <div
                                    className="w-full h-full flex items-center justify-center p-2 text-center leading-tight focus:outline-none"
                                    style={{ fontFamily: layer.fontFamily === 'DynaPuff' ? '"DynaPuff", cursive' : '"Nunito", sans-serif', fontSize: (layer.fontSize || 24) * scale, color: layer.color }}
                                >
                                    {layer.content}
                                </div>
                            ) : (
                                <img src={layer.content} className="w-full h-full object-cover pointer-events-none" />
                            )}
                        </Rnd>
                    ))}
                </div>
            </div>
        </div>
    );
};
