import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
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

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                        <Image className="w-4 h-4 mr-2" />
                        {value && (Array.isArray(value) ? value.length > 0 : value) ? "Change Image(s)" : "Select Image(s)"}
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[90vw] max-w-[90vw] sm:w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 overflow-x-hidden">
                    <DialogTitle>Select Media</DialogTitle>
                    <MediaLibrary onSelect={handleSelect} multiSelect={multiple} />
                    {multiple && (
                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => setOpen(false)}>Done</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
