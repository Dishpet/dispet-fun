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

// Assets
import rokoHead from "@/assets/roko-head.png";
import rokoSport from "@/assets/roko-sport.png";
import rokoCasual from "@/assets/roko-casual.png";
import socialRef1 from "@/assets/social graphics (1).png";
import socialRef2 from "@/assets/social graphics (2).png";

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
    const [includeRoko, setIncludeRoko] = useState(false);
    const [rokoPrompt, setRokoPrompt] = useState("");

    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Scale
    const [scale, setScale] = useState(0.5);

    useEffect(() => {
        setScale(0.6);
    }, []);

    const handleGenerateBackground = async () => {
        setIsGenerating(true);
        toast.info("Nano Banana is designing your post...");

        try {
            // 1. Prepare References
            const references = [socialRef1, socialRef2];
            if (includeRoko) {
                references.push(rokoHead, rokoSport, rokoCasual);
            }

            // 2. Prepare Prompt
            const dimensions = `${template.width}x${template.height}`;
            const prompt = `
                Create a high-quality social media background/post image.
                Dimensions needed: ${dimensions}.
                Style: Modern, energetic, vibrant, matching the provided 'social graphics' style references.
                ${includeRoko ? `Character: Include the character 'Roko' (donkey/mule) based on reference images. Action/Context: ${rokoPrompt || "Posing naturally"}.` : "No specific character, focus on background and layout graphics."}
                Ensure the composition leaves some space for text overlays.
                Output high resolution.
            `;

            // 3. Call Gemini
            // FIXED: Pass "{prompt}" as second arg so the first arg is injected correctly
            const resultBase64 = await generateImageWithGemini(prompt, "{prompt}", references);

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

                    {/* Roko Toggle */}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="roko-mode" className="cursor-pointer text-sm">Include Roko?</Label>
                        <Switch id="roko-mode" checked={includeRoko} onCheckedChange={setIncludeRoko} />
                    </div>

                    {includeRoko && (
                        <div className="space-y-2 animate-fade-in">
                            <Textarea
                                placeholder="What should Roko do? (e.g. Hold a sign)"
                                className="h-20 text-xs resize-none bg-white font-sans"
                                value={rokoPrompt}
                                onChange={(e) => setRokoPrompt(e.target.value)}
                            />
                            <div className="flex gap-1 justify-center opacity-70">
                                <img src={rokoHead} className="w-6 h-6 rounded-full border bg-white object-contain" title="Head" />
                                <img src={rokoSport} className="w-6 h-6 rounded-full border bg-white object-contain" title="Sport" />
                                <img src={rokoCasual} className="w-6 h-6 rounded-full border bg-white object-contain" title="Casual" />
                            </div>
                        </div>
                    )}

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
