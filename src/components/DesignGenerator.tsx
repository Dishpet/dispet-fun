import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Download, ChevronLeft, ChevronRight, Send, Upload } from "lucide-react";
import { StyleSelector } from "./StyleSelector";
import { toast } from "sonner";
import rokoCasual from "@/assets/roko-casual.png";
import rokoSport from "@/assets/roko-sport.png";
import rokoTracksuit from "@/assets/roko-tracksuit.png";

// Product Images
import hoodieProduct from "@/assets/products/hoodie.png";
import hatProduct from "@/assets/products/hat.png";
import ProductViewer from "./3d/ProductViewer";


const PRODUCTS = [
  {
    id: 'hoodie',
    name: 'Hoodie',
    image: hoodieProduct,
    overlayScale: 0.4,
    overlayY: 20,
    modelUrl: '/models/hoodie-webshop.glb',
    modelScale: 0.25,
    modelPos: [0, 0.28, 0.15] as [number, number, number],
    textureSettings: { flipX: false }
  },
  {
    id: 'tshirt',
    name: 'Majica',
    image: hoodieProduct, // Using hoodie image as placeholder or we should add a tshirt image? For now reuse.
    overlayScale: 0.4,
    overlayY: 20,
    modelUrl: '/models/tshirt_webshop.glb',
    modelScale: 0.25,
    modelPos: [0, 0.2, 0.2] as [number, number, number],
    textureSettings: { flipX: true }
  },
  {
    id: 'hat',
    name: 'Kapa',
    image: hatProduct,
    overlayScale: 0.35,
    overlayY: -10,
    modelUrl: '/models/cap_webshop.glb',
    modelScale: 0.15,
    modelPos: [0, 0.12, 0.15] as [number, number, number]
  },
];

export const DesignGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("cartoon");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);

  const currentProduct = PRODUCTS[currentProductIndex];

  const nextProduct = () => {
    setCurrentProductIndex((prev) => (prev + 1) % PRODUCTS.length);
  };

  const prevProduct = () => {
    setCurrentProductIndex((prev) => (prev - 1 + PRODUCTS.length) % PRODUCTS.length);
  };

  const [selectedColor, setSelectedColor] = useState<string>('#231f20');

  // Colors
  const PRODUCT_COLORS = [
    { name: 'Crna', hex: '#231f20' },
    { name: 'Siva', hex: '#d1d5db' },
    { name: 'Tirkizna', hex: '#00ab98' },
    { name: 'Cijan', hex: '#00aeef' },
    { name: 'Plava', hex: '#387bbf' },
    { name: 'Ljubičasta', hex: '#8358a4' },
    { name: 'Bijela', hex: '#ffffff' },
    { name: 'Roza', hex: '#e78fab' },
    { name: 'Mint', hex: '#a1d7c0' }
  ];

  // Convert images to base64
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
      img.src = src;
    });
  };



  // Simple Chroma Key / Flood Fill for transparency
  const removeBackgroundCanvas = async (base64Image: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Image);
          return;
        }
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Auto-detect background color from top-left pixel
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];

        // Tolerance for compression artifacts (e.g. JPG noise)
        const tolerance = 30;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Euclidean distance or simple absolute difference
          if (
            Math.abs(r - bgR) < tolerance &&
            Math.abs(g - bgG) < tolerance &&
            Math.abs(b - bgB) < tolerance
          ) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = base64Image;
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Molimo unesite opis dizajna");
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Generate Image (Skipped Translation Step)
      const { generateImageWithGemini } = await import("@/integrations/gemini/client");

      // Use raw prompt directly
      const finalPrompt = prompt;
      console.log("Using Prompt:", finalPrompt);

      // 2. Define Style Prompts
      const STYLE_PROMPTS: Record<string, string> = {
        synthwave: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, neon gradients ON THE CHARACTER ONLY, retro 80s colors, gridlines, glowing geometric fragments, and synthwave sun elements.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have bold neon edge lighting and strong outlines to separate clearly from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to premium streetwear, neon-retro artwork, or modern synthwave poster design.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
        gta: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, flat comic-cell shading, sharp color blocks, and minimal background elements inspired by GTA loading screen artwork.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have thick black outlines and strong color separation to stand out clearly from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to premium streetwear or stylized GTA poster graphics.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
        cyberpunk: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, holographic glows ON THE CHARACTER, neon lighting, electric fragments, cybernetic accents, and futuristic color palettes.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have bright neon edge lighting and strong glowing outlines to separate clearly from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to futuristic streetwear or modern neon cyberpunk posters.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
        cartoon: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold black outlines (3-4px thick), playful cartoon features, graffiti splashes, fun geometric fragments, and colorful dynamic highlights.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have thick black outlines and strong color separation to pop off the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to premium mascot logos or modern cartoon streetwear graphics.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
        retro: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, muted retro color palettes, halftone textures ON THE CHARACTER, and vintage geometric fragments.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have clear outlines and distinct color separation from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics inspired by classic vintage posters, ads and retro graphic design elements.\\n\\nRETRO / VINTAGE STYLE\\n\\nDesign requirements:\\n• SQUARE (1:1)\\n• Print-ready, high-resolution vector-like finish\\n• Central figure with dynamic depth\\n• Retro halftones, muted colors, vintage poster shapes and graphic design elements\\n• Balanced color blocking and strong contrast\\n• Clean separation between foreground and background\\n• PURE BLACK BACKGROUND ONLY - NO GRADIENTS\\n• No random artifacts, no borders, no watermarks\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
        inkpunk: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, aggressive ink strokes, splashes, neon drips ON THE CHARACTER, expressive brush fragments, and chaotic graffiti elements.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have strong ink outlines and dramatic color separation to stand out from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics inspired by expressive inkpunk and street-art fusion posters.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
        fantasy: "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, magical glows ON THE CHARACTER, enchanted particles, ornate fantasy fragments, and dramatic lighting.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have bright magical edge lighting and strong outlines to separate clearly from the black background.\\n\\nThe design should have a clear silhouette and strong central composition suitable for apparel printing.\\n\\nEnsure the illustration has crisp edges, perfect separation between character and background, and no unwanted text unless specified.\\n\\nUse professional print-design aesthetics similar to heroic fantasy posters and RPG character art.\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
        "abstract-geometry": "Create a high-resolution, print-ready illustration of this donkey {prompt} in a square aspect ratio. Use clean vector shapes, bold outlines, abstract geometric fragments AROUND THE CHARACTER, sharp angular shards, layered polygonal forms, floating particles, and dynamic composition.\\n\\nCRITICAL: The background MUST be PURE BLACK (#000000) - a SOLID SINGLE COLOR FILL with NO GRADIENTS. The character should have thick outlines and the geometric shapes should have strong color separation to create clear depth layers against the black background.\\n\\nThe design must focus on strong abstract geometry: triangles, rectangles, splinters, clusters, explosive directional shapes, and overlapping layers that create motion and depth behind the character.\\n\\nEnsure the illustration has a clear silhouette and a bold, distinct sticker-like cut-out shape, with crisp edge separation between the donkey and the geometric background.\\n\\nUse balanced color blocking, strong contrast, and a professional streetwear / modern graphic-art aesthetic.\\n\\nABSTRACT SHAPES & GEOMETRY STYLE\\n\\nDesign requirements:\\n• SQUARE (1:1)\\n• Print-ready, high-resolution vector-like finish\\n• Central figure with dynamic depth\\n• Abstract geometric fragments, shards, and layered shapes\\n• Balanced color blocking and strong contrast\\n• Clean separation between foreground and background\\n• PURE BLACK BACKGROUND ONLY - NO GRADIENTS\\n• No random artifacts, no borders, no watermarks\\n\\nIMPORTANT: DO NOT ADD ANY TRANSPARENT BACKGROUND. DO NOT REMOVE THE BLACK BACKGROUND. KEEP THE BLACK BACKGROUND INTACT.\\n\\nFINAL CHECK: BEFORE RETURNING THE IMAGE, VERIFY THAT THE BACKGROUND IS BLACK AND NOT TRANSPARENT.",
        realistic: "Photorealistic, highly detailed, 8k, cinematic lighting: {prompt}",
      };

      const styleTemplate = STYLE_PROMPTS[selectedStyle] || STYLE_PROMPTS.cartoon;

      // 3. Generate Image
      toast.info("Roko crta... (Generiranje)");
      const base64Image = await generateImageWithGemini(finalPrompt, styleTemplate);

      // 4. Remove Background (Canvas)
      toast.info("Obrada prozirnosti...");
      const processedImage = await removeBackgroundCanvas(base64Image);

      setGeneratedImage(processedImage);
      toast.success("Dizajn uspješno generiran!");

    } catch (error) {
      console.error('Generation error:', error);
      toast.error("Generiranje dizajna nije uspjelo. Provjerite API ključ u postavkama.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `roko-design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Dizajn preuzet!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Please upload an image smaller than 5MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;

        setIsGenerating(true);
        toast.info("Obrada pozadine (Color Key)...");

        try {
          const processedImage = await removeBackgroundCanvas(base64);
          setGeneratedImage(processedImage);
          toast.success("Slika učitana i obrađena!");
        } catch (error) {
          console.error("Background processing error:", error);
          setGeneratedImage(base64);
          toast.warning("Greška pri obradi pozadine.");
        } finally {
          setIsGenerating(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="min-h-screen w-full bg-white text-foreground flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-4xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-heading font-bold tracking-tight">Personalizirani merch</h1>
          </div>
          <div className="flex gap-2">
            {/* Placeholder for menu or other actions */}
            <div className="h-8 w-8 rounded-full bg-muted/20"></div>
          </div>
        </div>

        {/* Main Product Preview Area */}
        <div className="relative w-full aspect-square max-h-[500px] mx-auto flex items-center justify-center">

          {/* Navigation Arrows */}
          <button
            onClick={prevProduct}
            className="absolute left-0 z-20 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors backdrop-blur-sm"
          >
            <ChevronLeft className="h-8 w-8 text-primary" />
          </button>

          <button
            onClick={nextProduct}
            className="absolute right-0 z-20 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors backdrop-blur-sm"
          >
            <ChevronRight className="h-8 w-8 text-primary" />
          </button>

          {/* Product Image */}
          {currentProduct.modelUrl ? (
            <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-gray-50">
              <ProductViewer
                modelUrl={currentProduct.modelUrl}
                decalUrl={generatedImage}
                decalScale={currentProduct.modelScale}
                decalPosition={currentProduct.modelPos}
                colorOverride={selectedColor}
              />
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={currentProduct.image}
                alt={currentProduct.name}
                className="max-h-full max-w-full object-contain drop-shadow-2xl z-10"
              />

              {/* Generated Design Overlay */}
              {generatedImage && (
                <div
                  className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-transform duration-300"
                  style={{ transform: `translateY(${currentProduct.overlayY}px)` }}
                >
                  <div
                    className="w-[300px] h-[300px] flex items-center justify-center relative transition-transform duration-300"
                    style={{ transform: `scale(${currentProduct.overlayScale})` }}
                  >
                    <img
                      src={generatedImage}
                      alt="Generated Design"
                      className="w-full h-full object-contain drop-shadow-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Download Button (Floating) */}
          {generatedImage && (
            <div className="absolute bottom-4 right-4 z-30">
              <Button
                onClick={handleDownload}
                size="icon"
                className="rounded-full h-12 w-12 shadow-xl bg-secondary hover:bg-secondary/90"
              >
                <Download className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="space-y-6 max-w-2xl mx-auto w-full">

          {/* Color Picker */}
          <div className="space-y-3">
            <span className="text-sm font-medium text-muted-foreground ml-1">Odaberi Boju</span>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.hex)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color.hex ? 'border-primary scale-110 shadow-md ring-2 ring-primary/20' : 'border-transparent/10 hover:border-border'
                    }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Style Selector */}
          <StyleSelector selectedStyle={selectedStyle} onStyleSelect={setSelectedStyle} />

          {/* Input Area */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Opišite svoj dizajn (npr. Roko DJ-a u svemiru)..."
                className="pr-12 h-14 rounded-full border-2 bg-background/50 backdrop-blur-sm focus-visible:border-primary text-lg shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                size="icon"
                className="absolute right-1 top-1 h-12 w-12 rounded-full bg-primary hover:bg-primary/90 transition-all"
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                onChange={handleFileUpload}
                title="Upload custom print"
              />
              <Button size="icon" variant="outline" className="h-14 w-14 rounded-full border-2 shadow-sm bg-background/50 backdrop-blur-sm">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {currentProduct.name} Prikaz • AI Generirani Dizajni
          </p>

        </div>
      </div>
    </section>
  );
};
