import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Send, Upload, Check } from "lucide-react";
import { StyleSelector } from "@/components/StyleSelector";
import { toast } from "sonner";
import rokoCasual from "@/assets/roko-casual.png";
import rokoSport from "@/assets/roko-sport.png";
import rokoHead from "@/assets/roko-head.png";

interface AdminDesignGeneratorProps {
    onImageSelect: (imageUrl: string) => void;
    onCancel: () => void;
}

export const AdminDesignGenerator = ({ onImageSelect, onCancel }: AdminDesignGeneratorProps) => {
    const [prompt, setPrompt] = useState("");
    const [selectedStyle, setSelectedStyle] = useState("cartoon");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    // Convert images to base64 (reusing logic suitable for admin)
    const loadImageAsBase64 = async (src: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            // Handle local assets by ensuring path is correct
            img.src = src;
        });
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("Molimo unesite opis dizajna");
            return;
        }

        setIsGenerating(true);
        setGeneratedImage(null);

        try {
            // 1. Import Gemini Client
            const { refinePrompt, generateImageWithGemini } = await import("@/integrations/gemini/client");

            // 2. Prepare References - Convert to base64
            const referenceUrls = [rokoHead, rokoCasual, rokoSport];

            const characterImages = await Promise.all(
                referenceUrls.map(url => loadImageAsBase64(url))
            );

            toast.info("Refining prompt...");
            const refinedPrompt = await refinePrompt(prompt);
            console.log("Refined:", refinedPrompt);

            // 3. Define Style Prompts
            const userAction = prompt || "striking a fun, energetic pose";

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
                "no-style": `Create a high-resolution version of the mascot character (ROKO) ${userAction} in a square aspect ratio. Focus purely on the character's likeness and the requested action.

${charRefInfo}`,

                anime: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Use clean vector shapes, bold outlines, energetic anime effects, cel-shaded coloring, motion streaks, and vibrant color accents.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to premium streetwear, character-based graphics, or modern pop-anime poster styles.

ANIME STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• Anime-style effects, speed lines, glow accents`,

                synthwave: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Use clean vector shapes, bold outlines, neon gradients, retro 80s colors, gridlines, glowing geometric fragments, and synthwave sun elements.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to premium streetwear, neon-retro artwork, or modern synthwave poster design.

SYNTHWAVE STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• Neon, chrome, and synthwave design elements`,

                gta: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Use clean vector shapes, bold outlines, flat comic-cell shading, sharp color blocks, and minimal background elements inspired by GTA loading screen artwork.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to premium streetwear or stylized GTA poster graphics.

GTA STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• GTA-style shading, poster elements, and color blocking
• Balanced contrast and strong outlines`,

                cyberpunk: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Use clean vector shapes, bold outlines, holographic glows, neon lighting, electric fragments, cybernetic accents, and futuristic color palettes.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to futuristic streetwear or modern neon cyberpunk posters.

CYBERPUNK STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• Cyberpunk neon, holographic shapes, electric effects`,

                cartoon: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Use clean vector shapes, bold outlines, playful cartoon features, graffiti splashes, fun geometric fragments, and colorful dynamic highlights.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to premium mascot logos or modern cartoon streetwear graphics.

CARTOON MASCOT STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• Cartoon-style exaggeration, graffiti accents`,

                "3d": `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Use clean vector-inspired 3D shapes, bold outlines, soft cinematic lighting, glossy materials, and stylized shading.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to collectible 3D figurines or stylized 3D streetwear graphics.

3D STYLIZED STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• Stylized 3D lighting and smooth materials`,

                retro: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Use clean vector shapes, bold outlines, muted retro color palettes, halftone textures, and vintage geometric fragments.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics inspired by classic vintage posters and retro streetwear.

RETRO / VINTAGE STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• Retro halftones, muted colors, vintage poster shapes`,

                inkpunk: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Use clean vector shapes, bold outlines, aggressive ink strokes, splashes, neon drips, expressive brush fragments, and chaotic graffiti elements.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics inspired by expressive inkpunk and street-art fusion posters.

INKPUNK STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• Ink strokes, splatters, drips, neon graffiti chaos`,

                steampunk: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Use clean vector shapes, bold outlines, brass and copper tones, gears, goggles, mechanical fragments, and Victorian-inspired steampunk design elements.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to premium steampunk fashion and mechanical poster art.

STEAMPUNK STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• Steampunk gears, pipes, goggles, metallic textures`,

                noir: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Use clean vector shapes, bold outlines, heavy noir shadows, moody lighting, limited palette (black, white, red), and gritty comic-style textures.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics inspired by noir graphic novels and dark comic posters.

NOIR / DARK COMIC STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• Noir shadows, dramatic lighting, gritty comic shading`,

                fantasy: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Use clean vector shapes, bold outlines, magical glows, enchanted particles, ornate fantasy fragments, and dramatic lighting.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to heroic fantasy posters and RPG character art.

FANTASY / RPG STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• Magical particles, glowing runes, fantasy lighting`,

                minimalist: `Create a high-resolution, print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Use clean geometric vector shapes, bold outlines, smooth curves, limited color palette, and modern design fragments.

The design should have a clear silhouette and strong central composition suitable for apparel printing.

Use professional print-design aesthetics similar to minimalist vector posters and premium logo-style art.

MINIMALIST MODERN VECTOR STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• Minimal geometric shapes, clean flat colors`,

                "abstract-geometry": `Create a stunning, high-resolution print-ready illustration of the mascot character (ROKO) ${userAction} in a square aspect ratio. Surround the mascot character with a dynamic explosion of abstract shapes, colorful liquid splashes, sharp geometric fragments, stars, and vibrant decorative particles. Style reference: explosive, colorful, high-contrast liquid-geometric fusion. 

The design should have a clear silhouette and strong central composition suitable for apparel printing.

ABSTRACT SHAPES & GEOMETRY STYLE
${charRefInfo}

Design requirements:
• SQUARE (1:1)
• Abstract geometric fragments, shards, and layered shapes`,
            };
            const styleTemplate = STYLE_PROMPTS[selectedStyle] || STYLE_PROMPTS.cartoon;

            // 4. Generate with Nano Banana (Gemini 2.5)
            toast.info("Generating with Nano Banana...");

            // Pass reference images!
            const base64Image = await generateImageWithGemini(styleTemplate, "{prompt}", characterImages);

            if (base64Image) {
                setGeneratedImage(base64Image);
                toast.success("Generated successfully!");
            }

        } catch (error: any) {
            console.error('Generation error:', error);
            // Show more detailed error from client if available
            toast.error(error.message || "Generiranje nije uspjelo. Provjerite API ključ.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirm = async () => {
        if (generatedImage) {
            // In a real app, we might upload this base64 to WordPress Media Library here
            // For now, we pass the base64 URL directly to the product form 
            // (The ProductEditor will likely need to handle uploading it or using it as is)

            // OPTIONAL: Auto-upload to WP Media if needed, but for now let's pass it back.
            // If the parent expects an ID, we might have issues. 
            // Assuming parent expects a URL for preview.

            onImageSelect(generatedImage);
        }
    };

    return (
        <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-2">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold font-heading">AI Design Studio</h2>
                <p className="text-gray-500">
                    Describe your idea and let Nano Banana create it using Roko's reference images.
                </p>
            </div>

            <div className="bg-gray-50 p-3 sm:p-6 rounded-xl border border-gray-100">
                <div className="flex flex-col gap-4">
                    {/* Preview Area */}
                    <div className="aspect-square w-full max-w-sm mx-auto bg-white rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative">
                        {isGenerating ? (
                            <div className="text-center space-y-3">
                                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                                <p className="text-sm text-gray-500 font-medium animate-pulse">Creating masterpiece...</p>
                            </div>
                        ) : generatedImage ? (
                            <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-center text-gray-400">
                                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Driven by Gemini 2.5</p>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="space-y-4">
                        <StyleSelector selectedStyle={selectedStyle} onStyleSelect={setSelectedStyle} />

                        <div className="flex gap-2">
                            <Input
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="E.g. Roko playing saxophone on the moon..."
                                className="bg-white"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            />
                            <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <div className="space-x-2">
                    {generatedImage && (
                        <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white">
                            <Check className="w-4 h-4 mr-2" />
                            Use This Design
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
