import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { MediaLibrary } from "./MediaLibrary";
import { WPMedia } from "@/integrations/wordpress/types";
import { Image, X } from "lucide-react";

interface MediaPickerProps {
    value?: string | string[];
    onChange?: (value: any) => void;
    onSelectMedia?: (value: any) => void;
    multiple?: boolean;
}

export const MediaPicker = ({ value, onChange, onSelectMedia, multiple = false }: MediaPickerProps) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (media: WPMedia | WPMedia[]) => {
        if (multiple) {
            const list = Array.isArray(media) ? media : [media];
            if (onChange) onChange(list.map(m => m.source_url));
            if (onSelectMedia) onSelectMedia(list);
            // Don't close automatically for multi-select
        } else {
            const item = media as WPMedia;
            if (onChange) onChange(item.source_url);
            if (onSelectMedia) onSelectMedia(item);
            setOpen(false);
        }
    };

    const renderPreview = () => {
        if (!value) return null;

        if (Array.isArray(value)) {
            if (value.length === 0) return null;
            return (
                <div className="grid grid-cols-3 gap-2">
                    {value.map((url, i) => (
                        <div key={i} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                            <img src={url} alt={`Selected ${i}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const newValue = value.filter((_, idx) => idx !== i);
                                    if (onChange) onChange(newValue);
                                }}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                <img src={value} alt="Selected" className="w-full h-full object-contain" />
                <button
                    type="button"
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.preventDefault();
                        if (onChange) onChange("");
                    }}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {renderPreview()}

            <div className="space-y-4">
                <Button
                    variant="outline"
                    type="button"
                    onClick={() => setOpen(!open)}
                    className={cn(
                        "w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider border-slate-200 transition-all",
                        open ? "bg-slate-100" : "hover:bg-slate-50"
                    )}
                >
                    <Image className="w-4 h-4 mr-2" />
                    {open ? "Zatvori Galeriju" : (value && (Array.isArray(value) ? value.length > 0 : value) ? "Promijeni Sliku" : "Odaberi Sliku")}
                </Button>

                <Collapsible open={open}>
                    <CollapsibleContent>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Medijska Biblioteka</h4>
                                {multiple && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setOpen(false)}
                                        className="h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider text-primary"
                                    >
                                        Završi odabir
                                    </Button>
                                )}
                            </div>
                            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                <MediaLibrary onSelect={handleSelect} multiSelect={multiple} />
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    );
};
