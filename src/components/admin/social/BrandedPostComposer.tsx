import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, Download, RefreshCcw, Image as ImageIcon } from "lucide-react";
import { SocialTemplate } from "./SocialTemplateSelector";
import { useToast } from "@/components/ui/use-toast";

// Specific Assets for "Zabava" Design
import cokacRozi from "@/assets/elements/cokac-1-rozi.svg";
import kuglicaPlava from "@/assets/elements/kuglica-plava-01.svg";
import element26 from "@/assets/elements/element-26.svg";
import element28 from "@/assets/elements/element-28.svg";
import maskZabava from "@/assets/elements/element-01.svg"; // Big blob 1

// Specific Assets for "Zdravlje" Design
import kapljicaZelena from "@/assets/elements/kapljica-zelena-01.svg";
import kuglicaZuta from "@/assets/elements/kuglica-zuta-01.svg";
import ballIcon from "@/assets/elements/lopta-2-plava-01.svg";
import personIcon from "@/assets/elements/cokac-1-zuti-01.svg";
import maskZdravlje from "@/assets/elements/element-02.svg"; // Big blob 2

interface BrandedPostComposerProps {
    template: SocialTemplate;
    onBack: () => void;
}

export const BrandedPostComposer = ({ template, onBack }: BrandedPostComposerProps) => {
    const [image, setImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleDownload = async () => {
        toast({
            title: "Download Feature",
            description: "To save: Right click the image and select 'Save Image As', or use a screenshot tool. (Canvas export coming soon)",
        });
    };

    const OverlayZabava = () => (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {/* 2. Floating Elements (Zabava) */}
            {/* Note: Top layer elements that float OVER the masked image */}
            <img src={cokacRozi} className="absolute top-[10%] left-[5%] w-[250px] animate-pulse-slow opacity-90 drop-shadow-xl" alt="" />
            <img src={kuglicaPlava} className="absolute bottom-[20%] right-[5%] w-[150px] opacity-80" alt="" />
            <img src={element26} className="absolute top-[5%] right-[10%] w-[100px] text-yellow-400" alt="" />
            <img src={element28} className="absolute bottom-[40%] left-[-50px] w-[200px]" alt="" />

            {/* 3. Text Label */}
            <div className="absolute bottom-[8%] left-[8%]">
                <h2 className="text-white font-black text-6xl uppercase tracking-tighter drop-shadow-lg">
                    Zabava<span className="text-pink-500">.</span>
                </h2>
                <div className="h-2 w-32 bg-pink-500 mt-2 rounded-full shadow-lg shadow-pink-500/50"></div>
            </div>
        </div>
    );

    const OverlayZdravlje = () => (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {/* 2. Floating Elements (Zdravlje) */}
            <img src={kapljicaZelena} className="absolute top-[5%] right-[5%] w-[200px] rotate-45 drop-shadow-lg" alt="" />
            <img src={kuglicaZuta} className="absolute bottom-[10%] right-[10%] w-[180px]" alt="" />
            <img src={ballIcon} className="absolute top-[15%] left-[5%] w-[120px]" alt="" />
            <img src={personIcon} className="absolute bottom-[30%] left-[10%] w-[220px]" alt="" />

            {/* 3. Text Label */}
            <div className="absolute bottom-[8%] right-[8%] text-right">
                <h2 className="text-white font-black text-6xl uppercase tracking-tighter drop-shadow-lg">
                    Zdravlje<span className="text-green-500">.</span>
                </h2>
                <div className="h-2 w-32 bg-green-500 mt-2 rounded-full ml-auto shadow-lg shadow-green-500/50"></div>
            </div>
        </div>
    );

    // CSS Mask Styles for the User Image Layer
    const getMaskStyle = () => {
        if (template.id === 'branded-zabava') {
            return {
                maskImage: `url(${maskZabava})`,
                WebkitMaskImage: `url(${maskZabava})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
            };
        }
        if (template.id === 'branded-zdravlje') {
            return {
                maskImage: `url(${maskZdravlje})`,
                WebkitMaskImage: `url(${maskZdravlje})`,
                maskSize: 'contain', // Slightly larger for this one maybe?
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
            }
        }
        return {};
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" onClick={onBack} className="rounded-full">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </Button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{template.name}</h2>
                    <p className="text-slate-500 text-sm">Upload a photo to see the magic.</p>
                </div>
            </div>

            <div className="flex-1 flex gap-8 min-h-0">
                {/* 1. Controls Area */}
                <div className="w-80 flex flex-col gap-6 p-1">
                    <Card className="p-6 space-y-6 rounded-3xl border-none shadow-xl shadow-slate-200/50">
                        <div className="space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-purple-600" />
                                1. Upload Photo
                            </h3>
                            <div
                                onClick={triggerFileInput}
                                className="border-2 border-dashed border-slate-200 rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-purple-200 transition-all group"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <Upload className="w-8 h-8 text-slate-300 group-hover:text-purple-500 mb-2 transition-colors" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-600">Click to Upload</span>
                            </div>
                        </div>

                        {image && (
                            <div className="space-y-2">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <RefreshCcw className="w-4 h-4 text-purple-600" />
                                    2. Switch Template
                                </h3>
                                <p className="text-xs text-slate-400">Current: {template.id === 'branded-zabava' ? 'Zabava' : 'Zdravlje'}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100">
                            <Button onClick={handleDownload} className="w-full rounded-full h-12 font-bold bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200">
                                <Download className="w-4 h-4 mr-2" /> Download Design
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* 2. Canvas Area */}
                <div className="flex-1 bg-slate-100 rounded-[2.5rem] flex items-center justify-center p-8 overflow-hidden shadow-inner relative">
                    {/* The "Phone Screen" Container */}
                    <div
                        ref={canvasRef}
                        className="relative bg-white shadow-2xl shadow-slate-400/50 overflow-hidden"
                        style={{
                            width: '45vh', // Maintain aspect ratio roughly
                            aspectRatio: '9/16',
                            borderRadius: '0px',
                            backgroundColor: '#0f172a' // Dark Blue Brand Background
                        }}
                    >
                        {/* Layer 0: User Image (Masked) */}
                        {image ? (
                            <img
                                src={image}
                                className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500"
                                style={{
                                    ...getMaskStyle() // Apply the CSS Mask here!
                                }}
                                alt="User Upload"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a] text-slate-500 font-bold uppercase tracking-widest text-center p-12">
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 rounded-full border-4 border-slate-700 mx-auto flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-slate-700" />
                                    </div>
                                    <p>Select an Image</p>
                                </div>
                            </div>
                        )}

                        {/* Layer 1: Floating Elements (The overlays defined above) */}
                        {template.id === 'branded-zabava' && <OverlayZabava />}
                        {template.id === 'branded-zdravlje' && <OverlayZdravlje />}
                    </div>
                </div>
            </div>
        </div>
    );
};
