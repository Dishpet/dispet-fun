import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, RefreshCcw, Move, MousePointer2, Type } from "lucide-react";
import { SocialTemplate } from "./SocialTemplateSelector";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

// Import Masks
import mask1 from "@/assets/elements/masks/mask-1.svg";
import mask2 from "@/assets/elements/masks/mask-2.svg";
import mask3 from "@/assets/elements/masks/mask-3.svg";
import mask4 from "@/assets/elements/masks/mask-4.svg";
import mask5 from "@/assets/elements/masks/mask-5.svg";
import mask6 from "@/assets/elements/masks/mask-6.svg";

// Import Elements for decoration
import cokacRozi from "@/assets/elements/cokac-1-rozi.svg";
import kuglicaPlava from "@/assets/elements/kuglica-plava-01.svg";
import element26 from "@/assets/elements/element-26.svg";
import element28 from "@/assets/elements/element-28.svg";
import kapljicaZelena from "@/assets/elements/kapljica-zelena-01.svg";
import kuglicaZuta from "@/assets/elements/kuglica-zuta-01.svg";

interface MaskedPostComposerProps {
    template: SocialTemplate;
    uploadedImage: string;
    onBack: () => void;
}

const DECORATION_ELEMENTS = [
    cokacRozi,
    kuglicaPlava,
    element26,
    element28,
    kapljicaZelena,
    kuglicaZuta
];

type InteractionMode = 'image' | 'mask' | 'decoration' | 'text';
type BackgroundType = 'dark' | 'home' | 'shop';

const BACKGROUND_OPTIONS: Record<BackgroundType, { name: string; style: string }> = {
    dark: { name: 'Dark Blue', style: '#0f172a' },
    home: { name: 'Home Gradient', style: 'linear-gradient(to bottom right, #0044bf, #ad00e9)' },
    shop: { name: 'Shop Gradient', style: 'linear-gradient(to bottom right, #00ffbf, #0089cd)' }
};

const TEXT_COLORS = [
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#000000' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Yellow', value: '#fbbf24' },
    { name: 'Green', value: '#10b981' },
];

const maskMap: Record<number, string> = {
    1: mask1,
    2: mask2,
    3: mask3,
    4: mask4,
    5: mask5,
    6: mask6,
};

const maskSettings: Record<number, { size: string, position: string }> = {
    1: { size: '150%', position: '45% 45%' },
    2: { size: '160%', position: '70% 70%' },
    3: { size: '140%', position: '50% 85%' },
    4: { size: '155%', position: '30% 55%' },
    5: { size: '175%', position: '50% 20%' },
    6: { size: '150%', position: '55% 30%' },
};

export const MaskedPostComposer = ({ template, uploadedImage, onBack }: MaskedPostComposerProps) => {
    const { toast } = useToast();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [decorations, setDecorations] = useState<any[]>([]);

    // Interaction State
    const [activeMode, setActiveMode] = useState<InteractionMode>('image');
    const [background, setBackground] = useState<BackgroundType>('dark');
    const [selectedMaskId, setSelectedMaskId] = useState<number>(template.maskId || 1);

    // Text State
    const [textEnabled, setTextEnabled] = useState(false);
    const [textContent, setTextContent] = useState('Dišpet');
    const [textPos, setTextPos] = useState({ x: 0, y: 0 });
    const [textRotation, setTextRotation] = useState(0);
    const [textSize, setTextSize] = useState(48);
    const [textColor, setTextColor] = useState('#ffffff');

    // Decoration adjustment state
    const [selectedDecorationId, setSelectedDecorationId] = useState<number | null>(null);

    // Mask State
    const [maskOffset, setMaskOffset] = useState({ x: 0, y: 0 });
    const [maskScale, setMaskScale] = useState(1);
    const [maskRotation, setMaskRotation] = useState(0);

    // Image State
    const [imagePos, setImagePos] = useState({ x: 0, y: 0 });
    const [imageScale, setImageScale] = useState(1);
    const [imageRotation, setImageRotation] = useState(0);

    // Drag tracking
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const currentMask = maskMap[selectedMaskId];
    const defaultConfig = maskSettings[selectedMaskId];

    const generateDecorations = () => {
        const count = Math.floor(Math.random() * 3) + 3;
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            src: DECORATION_ELEMENTS[Math.floor(Math.random() * DECORATION_ELEMENTS.length)],
            top: Math.random() * 90,
            left: Math.random() * 90,
            size: Math.random() * 100 + 50,
            rotation: 0,
            zIndex: 20,
            // Position and transform
            x: 0,
            y: 0,
            scale: 1,
            angle: 0
        }));
    };

    useEffect(() => {
        setDecorations(generateDecorations());
    }, []);

    const regenerateDecorations = () => {
        setDecorations(generateDecorations());
        setSelectedDecorationId(null);
    };

    const updateDecoration = (id: number, updates: Partial<typeof decorations[0]>) => {
        setDecorations(prev => prev.map(deco =>
            deco.id === id ? { ...deco, ...updates } : deco
        ));
    };

    const selectedDecoration = decorations.find(d => d.id === selectedDecorationId);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;

        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        const rotateVector = (dx: number, dy: number, angleDeg: number) => {
            const rad = (angleDeg * Math.PI) / 180;
            return {
                x: dx * Math.cos(rad) - dy * Math.sin(rad),
                y: dx * Math.sin(rad) + dy * Math.cos(rad)
            };
        };

        if (activeMode === 'image') {
            const rotatedDelta = rotateVector(deltaX, deltaY, maskRotation);
            // Negate to fix inverted controls
            setImagePos(prev => ({ x: prev.x - rotatedDelta.x, y: prev.y - rotatedDelta.y }));
        } else if (activeMode === 'mask') {
            const rotatedDelta = rotateVector(deltaX, deltaY, -maskRotation);
            setMaskOffset(prev => ({ x: prev.x + rotatedDelta.x, y: prev.y + rotatedDelta.y }));
        } else if (activeMode === 'decoration' && selectedDecorationId !== null) {
            updateDecoration(selectedDecorationId, {
                x: (selectedDecoration?.x || 0) + deltaX,
                y: (selectedDecoration?.y || 0) + deltaY
            });
        } else if (activeMode === 'text') {
            setTextPos(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    // Touch handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            isDragging.current = true;
            const touch = e.touches[0];
            lastMousePos.current = { x: touch.clientX, y: touch.clientY };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current || e.touches.length !== 1) return;
        e.preventDefault();

        const touch = e.touches[0];
        const deltaX = touch.clientX - lastMousePos.current.x;
        const deltaY = touch.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: touch.clientX, y: touch.clientY };

        const rotateVector = (dx: number, dy: number, angleDeg: number) => {
            const rad = (angleDeg * Math.PI) / 180;
            return {
                x: dx * Math.cos(rad) - dy * Math.sin(rad),
                y: dx * Math.sin(rad) + dy * Math.cos(rad)
            };
        };

        if (activeMode === 'image') {
            const rotatedDelta = rotateVector(deltaX, deltaY, maskRotation);
            setImagePos(prev => ({ x: prev.x - rotatedDelta.x, y: prev.y - rotatedDelta.y }));
        } else if (activeMode === 'mask') {
            const rotatedDelta = rotateVector(deltaX, deltaY, -maskRotation);
            setMaskOffset(prev => ({ x: prev.x + rotatedDelta.x, y: prev.y + rotatedDelta.y }));
        } else if (activeMode === 'decoration' && selectedDecorationId !== null) {
            updateDecoration(selectedDecorationId, {
                x: (selectedDecoration?.x || 0) + deltaX,
                y: (selectedDecoration?.y || 0) + deltaY
            });
        } else if (activeMode === 'text') {
            setTextPos(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();

        if (e.shiftKey) {
            const rotateAmount = e.deltaY > 0 ? -5 : 5;
            if (activeMode === 'image') {
                setImageRotation(prev => prev + rotateAmount);
            } else if (activeMode === 'mask') {
                setMaskRotation(prev => prev + rotateAmount);
            } else if (activeMode === 'decoration' && selectedDecorationId !== null) {
                updateDecoration(selectedDecorationId, {
                    angle: (selectedDecoration?.angle || 0) + rotateAmount
                });
            } else if (activeMode === 'text') {
                setTextRotation(prev => prev + rotateAmount);
            }
        } else {
            const scaleFactor = e.deltaY > 0 ? 0.95 : 1.05;
            if (activeMode === 'image') {
                setImageScale(prev => Math.max(0.2, Math.min(5, prev * scaleFactor)));
            } else if (activeMode === 'mask') {
                setMaskScale(prev => Math.max(0.5, Math.min(3, prev * scaleFactor)));
            } else if (activeMode === 'decoration' && selectedDecorationId !== null) {
                updateDecoration(selectedDecorationId, {
                    scale: Math.max(0.5, Math.min(3, (selectedDecoration?.scale || 1) * scaleFactor))
                });
            } else if (activeMode === 'text') {
                setTextSize(prev => Math.max(12, Math.min(300, prev * scaleFactor)));
            }
        }
    };


    const containerStyle = useMemo(() => {
        return {
            aspectRatio: `${template.width}/${template.height}`,
            width: '100%',
            maxWidth: '600px',
            background: BACKGROUND_OPTIONS[background].style,
            position: 'relative' as const,
            cursor: activeMode === 'decoration' ? 'pointer' : (activeMode === 'text' ? 'text' : (activeMode === 'image' ? 'move' : 'crosshair'))
        };
    }, [template.width, template.height, activeMode, background]);

    const maskStyle = {
        maskImage: `url("${currentMask}")`,
        WebkitMaskImage: `url("${currentMask}")`,
        maskSize: `calc(${defaultConfig.size} * ${maskScale})`,
        WebkitMaskSize: `calc(${defaultConfig.size} * ${maskScale})`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: `calc(${defaultConfig.position.split(' ')[0]} + ${maskOffset.x}px) calc(${defaultConfig.position.split(' ')[1] || '50%'} + ${maskOffset.y}px)`,
        WebkitMaskPosition: `calc(${defaultConfig.position.split(' ')[0]} + ${maskOffset.x}px) calc(${defaultConfig.position.split(' ')[1] || '50%'} + ${maskOffset.y}px)`,
        width: '150%',
        height: '150%',
        left: '-25%',
        top: '-25%',
        position: 'absolute' as const,
        zIndex: 10,
        transform: `rotate(${maskRotation}deg)`,
        transformOrigin: 'center'
    };

    const handleDownload = async () => {
        if (!canvasRef.current) return;

        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(canvasRef.current, {
                backgroundColor: null,
                scale: 2,
                logging: false,
            });

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
                    link.click();
                    URL.revokeObjectURL(url);

                    toast({
                        title: "Success!",
                        description: "Your design has been downloaded",
                    });
                }
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to download design",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-4 lg:p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" onClick={onBack} className="rounded-full">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </Button>
                <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-slate-900">{template.name}</h2>
                    <p className="text-slate-500 text-sm">Customize your post</p>
                </div>
            </div>

            {/* Main Content - Mobile First, Desktop 50/50 */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-stretch">
                {/* Preview Area - Shows first on mobile, right on desktop */}
                <div className="min-h-[400px] lg:min-h-0 flex-shrink-0 lg:flex-1 lg:order-1 flex items-center justify-center bg-slate-50 rounded-3xl p-4 lg:p-8">
                    <div
                        ref={canvasRef}
                        style={containerStyle}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onWheel={handleWheel}
                        className="relative overflow-hidden rounded-2xl shadow-2xl touch-none"
                    >
                        {/* Mask Container */}
                        <div style={maskStyle}>
                            <img
                                src={uploadedImage}
                                alt="Uploaded"
                                style={{
                                    transform: `rotate(${-maskRotation}deg) translate(${imagePos.x}px, ${imagePos.y}px) rotate(${imageRotation}deg) scale(${imageScale})`,
                                    transformOrigin: 'center',
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0
                                }}
                            />
                        </div>

                        {/* Decorations */}
                        {decorations.map((deco) => (
                            <div
                                key={deco.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDecorationId(deco.id);
                                    setActiveMode('decoration');
                                }}
                                className={`absolute cursor-pointer transition-all ${selectedDecorationId === deco.id ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                                    }`}
                                style={{
                                    top: `calc(${deco.top}% + ${deco.y}px)`,
                                    left: `calc(${deco.left}% + ${deco.x}px)`,
                                    width: `${deco.size * deco.scale}px`,
                                    height: `${deco.size * deco.scale}px`,
                                    transform: `rotate(${deco.angle}deg)`,
                                    zIndex: deco.zIndex,
                                    pointerEvents: 'auto'
                                }}
                            >
                                <img
                                    src={deco.src}
                                    alt=""
                                    className="w-full h-full object-contain"
                                    style={{ pointerEvents: 'none' }}
                                />
                            </div>
                        ))}

                        {/* Text Overlay */}
                        {textEnabled && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: `translate(calc(-50% + ${textPos.x}px), calc(-50% + ${textPos.y}px)) rotate(${textRotation}deg)`,
                                    fontFamily: 'DynaPuff, cursive',
                                    fontSize: `${textSize}px`,
                                    fontWeight: 700,
                                    color: textColor,
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                    whiteSpace: 'nowrap',
                                    zIndex: 30,

                                    pointerEvents: 'auto',
                                    userSelect: 'none',
                                    cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMode('text');
                                }}
                                className={`transition-all ${activeMode === 'text' ? 'ring-2 ring-purple-500 ring-offset-4 rounded-lg' : ''}`}
                            >
                                {textContent}
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls Area - Shows second on mobile, left on desktop, scrollable */}
                <div className="flex-shrink-0 lg:flex-1 overflow-y-auto">
                    <Card className="p-4 lg:p-6 space-y-6 rounded-3xl border-none shadow-xl">
                        {/* Editing Mode */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-900">Editing Mode</h3>
                            <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as InteractionMode)} className="w-full">
                                <TabsList className="grid w-full grid-cols-4 rounded-full h-11 bg-slate-100">
                                    <TabsTrigger value="image" className="rounded-full flex gap-1.5 text-xs lg:text-sm">
                                        <Move className="w-3.5 h-3.5" /> Image
                                    </TabsTrigger>
                                    <TabsTrigger value="mask" className="rounded-full flex gap-1.5 text-xs lg:text-sm">
                                        <MousePointer2 className="w-3.5 h-3.5" /> Mask
                                    </TabsTrigger>
                                    <TabsTrigger value="decoration" className="rounded-full flex gap-1.5 text-xs lg:text-sm">
                                        <RefreshCcw className="w-3.5 h-3.5" /> Decor
                                    </TabsTrigger>
                                    <TabsTrigger value="text" className="rounded-full flex gap-1.5 text-xs lg:text-sm">
                                        <Type className="w-3.5 h-3.5" /> Text
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <p className="text-[10px] lg:text-xs text-slate-500 text-center">
                                Click element to select • Drag to move • Scroll to scale • Shift+Scroll to rotate
                            </p>
                        </div>

                        {/* Mask Style Picker */}
                        <div className="space-y-3 border-t pt-4 border-slate-100">
                            <h3 className="font-bold text-slate-900">1. Mask Style</h3>
                            <div className="grid grid-cols-6 gap-2">
                                {[1, 2, 3, 4, 5, 6].map((maskId) => (
                                    <button
                                        key={maskId}
                                        onClick={() => setSelectedMaskId(maskId)}
                                        className={`relative aspect-square rounded-xl border-2 transition-all overflow-hidden ${selectedMaskId === maskId
                                            ? 'border-purple-500 shadow-lg scale-105'
                                            : 'border-slate-200 hover:border-purple-300'
                                            }`}
                                        style={{ background: '#0f172a' }}
                                    >
                                        <div
                                            className="absolute inset-0 bg-white opacity-20"
                                            style={{
                                                maskImage: `url("${maskMap[maskId]}")`,
                                                WebkitMaskImage: `url("${maskMap[maskId]}")`,
                                                maskSize: '60%',
                                                WebkitMaskSize: '60%',
                                                maskRepeat: 'no-repeat',
                                                WebkitMaskRepeat: 'no-repeat',
                                                maskPosition: 'center',
                                                WebkitMaskPosition: 'center'
                                            }}
                                        />
                                        {selectedMaskId === maskId && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-5 h-5 rounded-full bg-white shadow-lg flex items-center justify-center">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Background */}
                        <div className="space-y-3 border-t pt-4 border-slate-100">
                            <h3 className="font-bold text-slate-900">2. Background</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(BACKGROUND_OPTIONS) as BackgroundType[]).map((bg) => (
                                    <button
                                        key={bg}
                                        onClick={() => setBackground(bg)}
                                        className={`relative h-16 rounded-xl border-2 transition-all overflow-hidden ${background === bg
                                            ? 'border-purple-500 shadow-lg scale-105'
                                            : 'border-slate-200 hover:border-purple-300'
                                            }`}
                                        style={{ background: BACKGROUND_OPTIONS[bg].style }}
                                    >
                                        {background === bg && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center">
                                                    <div className="w-3 h-3 rounded-full bg-purple-600" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 text-center">
                                {BACKGROUND_OPTIONS[background].name}
                            </p>
                        </div>

                        {/* Decorations */}
                        <div className="space-y-3 border-t pt-4 border-slate-100">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <RefreshCcw className="w-4 h-4 text-purple-600" />
                                3. Decorations
                            </h3>
                            <Button onClick={regenerateDecorations} variant="outline" className="w-full rounded-full h-10">
                                Shuffle Decorations
                            </Button>

                            {selectedDecorationId !== null && (
                                <p className="text-xs text-slate-500 text-center pt-2">
                                    Element #{selectedDecorationId + 1} selected • Use Decor mode to adjust
                                </p>
                            )}
                        </div>

                        {/* Text Controls */}
                        <div className="space-y-3 border-t pt-4 border-slate-100">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Type className="w-4 h-4 text-purple-600" />
                                    4. Text
                                </h3>
                                <button
                                    onClick={() => setTextEnabled(!textEnabled)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${textEnabled
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {textEnabled ? 'ON' : 'OFF'}
                                </button>
                            </div>

                            {textEnabled && (
                                <div className="space-y-4 pt-2">
                                    {/* Text Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Text</label>
                                        <input
                                            type="text"
                                            value={textContent}
                                            onChange={(e) => setTextContent(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-purple-500 focus:outline-none font-heading font-bold"
                                            placeholder="Enter text..."
                                        />
                                    </div>

                                    {/* Text Color */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Color</label>
                                        <div className="grid grid-cols-6 gap-2">
                                            {TEXT_COLORS.map((color) => (
                                                <button
                                                    key={color.value}
                                                    onClick={() => setTextColor(color.value)}
                                                    className={`w-full aspect-square rounded-lg border-2 transition-all ${textColor === color.value
                                                        ? 'border-purple-500 scale-110'
                                                        : 'border-slate-200 hover:border-purple-300'
                                                        }`}
                                                    style={{ backgroundColor: color.value }}
                                                    title={color.name}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Text Size (also controllable via scroll) */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Size: {Math.round(textSize)}px
                                        </label>
                                        <Slider
                                            value={[textSize]}
                                            onValueChange={(v) => setTextSize(v[0])}
                                            min={24}
                                            max={120}
                                            step={4}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Download - Last */}
                        <div className="pt-4">
                            <Button onClick={handleDownload} className="w-full rounded-full h-12 font-bold bg-purple-600 hover:bg-purple-700 shadow-lg">
                                <Download className="w-5 h-5 mr-2" />
                                Download Design
                            </Button>
                        </div>
                    </Card>
                </div>
            </div >
        </div >
    );
};
