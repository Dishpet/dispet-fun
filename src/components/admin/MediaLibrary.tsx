import { useState, useEffect } from "react";
import { getMedia, uploadMedia } from "@/integrations/wordpress/media";
import { WPMedia } from "@/integrations/wordpress/types";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MediaLibraryProps {
    onSelect?: (media: WPMedia | WPMedia[]) => void;
    multiSelect?: boolean;
    value?: string | string[];
}

const ITEMS_PER_PAGE = 24;

export const MediaLibrary = ({ onSelect, multiSelect = false }: MediaLibraryProps) => {
    const [media, setMedia] = useState<WPMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<WPMedia[]>([]);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const { toast } = useToast();

    useEffect(() => {
        loadMedia(page);
    }, [page]);

    const loadMedia = async (pageToLoad: number) => {
        setLoading(true);
        try {
            const { data, totalPages: total } = await getMedia(pageToLoad, ITEMS_PER_PAGE);

            setMedia(data);
            setTotalPages(total);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load media", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (page < totalPages) setPage(p => p + 1);
    };

    const handlePrev = () => {
        if (page > 1) setPage(p => p - 1);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);
        try {
            const uploaded = await uploadMedia(file);
            setMedia([uploaded, ...media]);
            toast({ title: "Success", description: "Image uploaded successfully" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Upload failed", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleSelect = (item: WPMedia) => {
        let newSelection: WPMedia[];

        if (multiSelect) {
            const isSelected = selectedItems.some(i => i.id === item.id);
            if (isSelected) {
                newSelection = selectedItems.filter(i => i.id !== item.id);
            } else {
                newSelection = [...selectedItems, item];
            }
        } else {
            newSelection = [item];
        }

        setSelectedItems(newSelection);

        if (onSelect) {
            if (multiSelect) {
                onSelect(newSelection);
            } else {
                onSelect(newSelection[0]);
            }
        }
    };

    const isSelected = (id: number) => selectedItems.some(i => i.id === id);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Media Library</h3>
                <div className="flex gap-2 items-center">
                    <span className="text-sm text-gray-500 mr-2">
                        {selectedItems.length > 0 ? `${selectedItems.length} selected` : ''}
                    </span>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            id="media-upload"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                        <label htmlFor="media-upload">
                            <Button variant="outline" size="sm" className="cursor-pointer" asChild disabled={uploading}>
                                <span>
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                    Upload
                                </span>
                            </Button>
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 border rounded-lg p-4 min-h-[400px] flex flex-col">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <>
                        {media.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                                {media.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all group bg-white",
                                            isSelected(item.id) ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-gray-300"
                                        )}
                                        onClick={() => handleSelect(item)}
                                    >
                                        <img
                                            src={item.media_details?.sizes?.thumbnail?.source_url || item.source_url}
                                            alt={item.title.rendered}
                                            className="w-full h-full object-cover"
                                        />
                                        {isSelected(item.id) && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <div className="bg-white rounded-full p-1">
                                                    <Check className="w-4 h-4 text-primary" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                No media found on this page.
                            </div>
                        )}

                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrev}
                                disabled={page <= 1 || loading}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                            </Button>

                            <span className="text-sm text-gray-500">
                                Page {page} of {totalPages || 1}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNext}
                                disabled={page >= totalPages || loading}
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
