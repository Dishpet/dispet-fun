import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, Check, Move, ZoomIn } from "lucide-react";

// Asset Imports
import blackFront from "@/assets/hoodie-string-black (2).png";
import blackBack from "@/assets/hoodie-string-black (4).png";
import greyFront from "@/assets/hoodie-string-grey (3).png";
import greyBack from "@/assets/hoodie-string-grey (4).png";
import logoWhite from "@/assets/1web-logo-whitel.png";

import { removeBlackBackground } from "@/utils/imageUtils";
import { toast } from "sonner";

interface ProductMockupPreviewProps {
    generatedDesign: string;
    onConfirm: (finalImage: string) => void;
    onBack: () => void;
}

export const ProductMockupPreview = ({ generatedDesign, onConfirm, onBack }: ProductMockupPreviewProps) => {
    const [processedDesign, setProcessedDesign] = useState<string | null>(null);
    const [hoodieColor, setHoodieColor] = useState<'black' | 'grey'>('black');
    const [mainPlacement, setMainPlacement] = useState<'front' | 'back'>('front');
    const [addLogo, setAddLogo] = useState(false);

    // Transform States (Percentages 0-100)
    // Main Design
    const [designPos, setDesignPos] = useState({ x: 50, y: 40 });
    const [designScale, setDesignScale] = useState(30);
    // Logo
    const [logoPos, setLogoPos] = useState({ x: 50, y: 20 });
    const [logoScale, setLogoScale] = useState(15);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initial background removal
    useEffect(() => {
        const process = async () => {
            try {
                toast.info("Nano Banana processing background...");
                const clean = await removeBlackBackground(generatedDesign);
                setProcessedDesign(clean);
                toast.success("Background removed!");
            } catch (e) {
                console.error(e);
                toast.error("Failed to remove background");
                setProcessedDesign(generatedDesign); // Fallback
            }
        };
        process();
    }, [generatedDesign]);

    // Helpers
    const getBaseImage = (side: 'front' | 'back') => {
        if (hoodieColor === 'black') return side === 'front' ? blackFront : blackBack;
        return side === 'front' ? greyFront : greyBack;
    };

    const handleConfirm = async () => {
        // We need to render the FINAL composite image to allow the user to use it as the product image
        // Or do we return the design and just configured settings?
        // User asked: "preview how it looks... Use This Design"
        // Usually we want the MOCKUP as the product image.

        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL("image/png");
        onConfirm(dataUrl);
    };

    // Render Preview
    // We render the CURRENT VIEW (Front or Back)
    // But for the FINAL output, we might want both? 
    // For now, let's assume we output the view that contains the MAIN DESIGN or just the currently visible one.
    // Let's output the currently visible view as the primary product image.

    // Canvas Compositing
    useEffect(() => {
        if (!canvasRef.current || !processedDesign) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const base = new Image();
        base.crossOrigin = "anonymous";
        base.src = getBaseImage(mainPlacement === 'front' ? 'front' : 'back');

        // Logic: 
        // If MainPlacement is Front:
        //   - Showing Front: Render Base(Front) + Design
        //   - Showing Back: Render Base(Back) + Logo (if enabled)

        // Wait, the preview should allow switching views.
        // Let's add a "View Side" toggle independent of "Placement".

        // Actually, to keep it simple: 
        // We are configuring the PRODUCT.
        // We see the side where the Main Design is.
        // If we flip to the other side, we see the Logo.

        base.onload = () => {
            canvas.width = base.width;
            canvas.height = base.height; // Keep resolution high

            // Draw Hoodie
            ctx.drawImage(base, 0, 0);

            // Determine what to draw on this specific view
            // Let's assume the canvas currently shows the MAIN PLACEMENT side

            // Draw Main Design
            const design = new Image();
            design.src = processedDesign;
            design.onload = () => {
                const w = (base.width * designScale) / 100;
                const h = (w * design.height) / design.width;
                const x = (base.width * designPos.x) / 100 - w / 2;
                const y = (base.height * designPos.y) / 100 - h / 2;

                ctx.drawImage(design, x, y, w, h);

                // Draw Print Area Box (Guide)
                ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, w, h);
            };
        };

    }, [processedDesign, hoodieColor, mainPlacement, designPos, designScale]);

    // We need a separate composite function just for the "On Render" to handle the logo view etc.
    // Ideally we'd have a "Active View" state (Front/Back) separate from "Main Placement" state.

    // Redoing Render Logic for UI:
    // UI shows TWO tabs or toggle: "Front View", "Back View".
    // "Main Design Placement": Radio [Front] [Back].
    // If MainPlacement == Front:
    //    Front View shows Design.
    //    Back View shows Logo (if enabled).

    const [activeView, setActiveView] = useState<'front' | 'back'>('front');

    useEffect(() => {
        // This effect handles drawing to canvas whenever state changes
        if (!canvasRef.current || !processedDesign) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const base = new Image();
        base.src = getBaseImage(activeView);
        base.onload = () => {
            canvas.width = base.width;
            canvas.height = base.height;

            ctx.drawImage(base, 0, 0);

            // What do we draw?
            const isMainSide = activeView === mainPlacement;

            if (isMainSide) {
                // Draw Main Design
                const img = new Image();
                img.src = processedDesign;
                img.onload = () => {
                    drawLayer(ctx, img, designPos, designScale, true);
                };
            } else if (addLogo) {
                // Draw Logo
                const img = new Image();
                img.src = logoWhite;
                img.onload = () => {
                    drawLayer(ctx, img, logoPos, logoScale, false);
                };
            }
        };

        const drawLayer = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, pos: { x: number, y: number }, scale: number, isMain: boolean) => {
            const w = (ctx.canvas.width * scale) / 100;
            const h = (w * img.height) / img.width;
            const x = (ctx.canvas.width * pos.x) / 100 - w / 2;
            const y = (ctx.canvas.height * pos.y) / 100 - h / 2;

            ctx.drawImage(img, x, y, w, h);

            // Guide Box
            ctx.strokeStyle = isMain ? "rgba(0, 200, 255, 0.5)" : "rgba(255, 100, 100, 0.5)";
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
            ctx.setLineDash([]);
        };

    }, [activeView, processedDesign, hoodieColor, mainPlacement, addLogo, designPos, designScale, logoPos, logoScale]);


    if (!processedDesign) return <div className="p-10 text-center">Processing Design...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full max-h-[80vh]">
            {/* Controls */}
            <div className="md:col-span-1 space-y-6 overflow-y-auto pr-2">

                {/* Hoodie Select */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-bold">1. Hoodie Options</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div
                            className={`p-2 border rounded cursor-pointer text-center ${hoodieColor === 'black' ? 'ring-2 ring-primary border-primary' : 'hover:bg-white'}`}
                            onClick={() => setHoodieColor('black')}
                        >
                            <div className="w-6 h-6 bg-black rounded-full mx-auto mb-1 border border-white"></div>
                            <span className="text-xs font-medium">Black</span>
                        </div>
                        <div
                            className={`p-2 border rounded cursor-pointer text-center ${hoodieColor === 'grey' ? 'ring-2 ring-primary border-primary' : 'hover:bg-white'}`}
                            onClick={() => setHoodieColor('grey')}
                        >
                            <div className="w-6 h-6 bg-gray-400 rounded-full mx-auto mb-1"></div>
                            <span className="text-xs font-medium">Grey</span>
                        </div>
                    </div>
                </div>

                {/* Placement Select */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-bold">2. Design Placement</h3>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant={mainPlacement === 'front' ? 'default' : 'outline'}
                            onClick={() => { setMainPlacement('front'); setActiveView('front'); }}
                            className="flex-1"
                        >
                            Front
                        </Button>
                        <Button
                            variant={mainPlacement === 'back' ? 'default' : 'outline'}
                            onClick={() => { setMainPlacement('back'); setActiveView('back'); }}
                            className="flex-1"
                        >
                            Back
                        </Button>
                    </div>
                </div>

                {/* Logo Option */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-0.5">
                        <Label>Add Logo to {mainPlacement === 'front' ? 'Back' : 'Front'}?</Label>
                        <div className="text-xs text-muted-foreground">Adds 1web-logo-white</div>
                    </div>
                    <Switch checked={addLogo} onCheckedChange={setAddLogo} />
                </div>

                {/* Adjustments */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-bold">3. Adjustments</h3>
                    <Tabs value={activeView} onValueChange={(v: string) => setActiveView(v as 'front' | 'back')}>
                        <TabsList className="w-full">
                            <TabsTrigger value="front" className="flex-1">Edit Front</TabsTrigger>
                            <TabsTrigger value="back" className="flex-1">Edit Back</TabsTrigger>
                        </TabsList>

                        <div className="pt-4 space-y-4">
                            {/* Logic: If editing the Main Design view */}
                            {(activeView === mainPlacement) ? (
                                <>
                                    <div className="text-sm font-medium text-blue-600">Editing: Main Design</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between"><Label>Size</Label> <span className="text-xs">{designScale}%</span></div>
                                        <Slider value={[designScale]} onValueChange={([v]) => setDesignScale(v)} min={5} max={80} step={1} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between"><Label>Vertical Position</Label> <span className="text-xs">{designPos.y}%</span></div>
                                        <Slider value={[designPos.y]} onValueChange={([v]) => setDesignPos(p => ({ ...p, y: v }))} min={0} max={100} step={1} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between"><Label>Horizontal Position</Label> <span className="text-xs">{designPos.x}%</span></div>
                                        <Slider value={[designPos.x]} onValueChange={([v]) => setDesignPos(p => ({ ...p, x: v }))} min={0} max={100} step={1} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-sm font-medium text-red-600">Editing: Logo Layer</div>
                                    {!addLogo ? (
                                        <div className="text-sm text-gray-500 italic">Logo disabled</div>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <div className="flex justify-between"><Label>Size</Label> <span className="text-xs">{logoScale}%</span></div>
                                                <Slider value={[logoScale]} onValueChange={([v]) => setLogoScale(v)} min={2} max={40} step={1} />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between"><Label>Vertical Position</Label> <span className="text-xs">{logoPos.y}%</span></div>
                                                <Slider value={[logoPos.y]} onValueChange={([v]) => setLogoPos(p => ({ ...p, y: v }))} min={0} max={100} step={1} />
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </Tabs>
                </div>

            </div>

            {/* Preview Area */}
            <div className="md:col-span-2 bg-gray-100 rounded-xl flex items-center justify-center p-4 relative border shadow-inner">
                <div className="relative w-full h-full flex items-center justify-center">
                    <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-full shadow-2xl rounded"
                    />
                </div>

                {/* Floating Actions */}
                <div className="absolute bottom-6 right-6 flex gap-2">
                    <Button variant="secondary" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4 mr-2" /> Create Product
                    </Button>
                </div>
            </div>
        </div>
    );
};
