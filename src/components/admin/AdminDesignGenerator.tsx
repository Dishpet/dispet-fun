import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Send, Upload, Check } from "lucide-react";
import { StyleSelector } from "@/components/StyleSelector";
import { toast } from "sonner";
import rokoCasual from "@/assets/roko-casual.png";
import rokoSport from "@/assets/roko-sport.png";
import rokoTracksuit from "@/assets/roko-tracksuit.png";
import rokoHead from "@/assets/roko-head.png";
import rokoHead2 from "@/assets/roko-head-2.png";

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
            // 1. Load Reference Images
            const characterImages = await Promise.all([
                loadImageAsBase64(rokoCasual),
                loadImageAsBase64(rokoSport),
                loadImageAsBase64(rokoTracksuit),
                loadImageAsBase64(rokoHead),
                loadImageAsBase64(rokoHead2),
            ]);

            // 2. Import Gemini Client
            const { refinePrompt, generateImageWithGemini } = await import("@/integrations/gemini/client");

            toast.info("Refining prompt...");
            const refinedPrompt = await refinePrompt(prompt);
            console.log("Refined:", refinedPrompt);

            // 3. Define Styles (Synced with original high-quality prompts)
            const STYLE_PROMPTS: Record<string, string> = {
                synthwave: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, neon gradients ON THE CHARACTER ONLY, retro 80s colors, gridlines, glowing geometric fragments, and synthwave sun elements.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have bold neon edge lighting and strong outlines to separate clearly from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to premium streetwear, neon-retro artwork, or modern synthwave poster design.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
                gta: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, flat comic-cell shading, sharp color blocks, and minimal background elements inspired by GTA loading screen artwork.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have thick black outlines and strong color separation to stand out clearly from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to premium streetwear or stylized GTA poster graphics.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
                cyberpunk: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, holographic glows ON THE CHARACTER, neon lighting, electric fragments, cybernetic accents, and futuristic color palettes.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have bright neon edge lighting and strong glowing outlines to separate clearly from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to futuristic streetwear or modern neon cyberpunk posters.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
                cartoon: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold black outlines (3-4px thick), playful cartoon features, graffiti splashes, fun geometric fragments, and colorful dynamic highlights.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have thick black outlines and strong color separation to pop off the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to premium mascot logos or modern cartoon streetwear graphics.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
                retro: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, muted retro color palettes, halftone textures ON THE CHARACTER, and vintage geometric fragments.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have clear outlines and distinct color separation from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics inspired by classic vintage posters, ads and retro graphic design elements.\\n\\nRETRO / VINTAGE STYLE\\n\\nDesign requirements:\\n• SQUARE (1:1)\\n• Print-ready, high-resolution vector-like finish\\n• Central figure with dynamic depth\\n• Retro halftones, muted colors, vintage poster shapes and graphic design elements\\n• Balanced color blocking and strong contrast\\n• Clean separation between foreground and background\\n• PURE BLACK BACKGROUND ONLY - NO GRADIENTS\\n• No random artifacts, no borders, no watermarks\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
                inkpunk: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, aggressive ink strokes, splashes, neon drips ON THE CHARACTER, expressive brush fragments, and chaotic graffiti elements.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have strong ink outlines and dramatic color separation to stand out from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics inspired by expressive inkpunk and street-art fusion posters.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
                fantasy: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, magical glows ON THE CHARACTER, enchanted particles, ornate fantasy fragments, and dramatic lighting.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have bright magical edge lighting and strong outlines to separate clearly from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to heroic fantasy posters and RPG character art.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
                "abstract-geometry": "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, abstract geometric fragments AROUND THE CHARACTER, sharp angular shards, layered polygonal forms, floating particles, and dynamic composition.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have thick outlines and the geometric shapes should have strong color separation to create clear depth layers against the black background.\\n\\nThe design must focus on strong abstract geometry: triangles, rectangles, splinters, clusters, explosive directional shapes, and overlapping layers that create motion and depth behind the character.\\n\\nEnsure the illustration has a clear silhouette and a bold, distinct sticker-like cut-out shape, with crisp edge separation between the donkey and the geometric background.\\n\\nUse balanced color blocking, strong contrast, and a professional streetwear / modern graphic-art aesthetic.\\n\\nABSTRACT SHAPES & GEOMETRY STYLE\\n\\nDesign requirements:\\n• SQUARE (1:1)\\n• Print-ready, high-resolution vector-like finish\\n• Central figure with dynamic depth\\n• Abstract geometric fragments, shards, and layered shapes\\n• Balanced color blocking and strong contrast\\n• Clean separation between foreground and background\\n• PURE BLACK BACKGROUND ONLY - NO GRADIENTS\\n• No random artifacts, no borders, no watermarks\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
                realistic: "Photorealistic, highly detailed, 8k, cinematic lighting: {prompt}", // Keep simple or improve if needed
            };
            const styleTemplate = STYLE_PROMPTS[selectedStyle] || STYLE_PROMPTS.cartoon;

            // 4. Generate with Nano Banana (Gemini 2.5)
            toast.info("Generating with Nano Banana...");

            // Pass reference images!
            const base64Image = await generateImageWithGemini(refinedPrompt, styleTemplate, characterImages);

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
