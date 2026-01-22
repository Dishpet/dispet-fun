import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPosts } from "@/integrations/wordpress/posts";

// Default Images
// Importing a batch to populate nicely
import img1 from "@/assets/gallery/gallery (1).jpg";
import img2 from "@/assets/gallery/gallery (2).jpg";
import img3 from "@/assets/gallery/gallery (3).jpg";
import img4 from "@/assets/gallery/gallery (4).jpg";
import img5 from "@/assets/gallery/gallery (5).jpg";
import img6 from "@/assets/gallery/gallery (6).jpg";
import img7 from "@/assets/gallery/gallery (7).jpg";
import img8 from "@/assets/gallery/gallery (8).jpg";
import img9 from "@/assets/gallery/gallery (9).jpg";
import img10 from "@/assets/gallery/gallery (10).jpg";
import img11 from "@/assets/gallery/gallery (11).jpg";
import img12 from "@/assets/gallery/gallery (12).jpg";

const DEFAULT_IMAGES = [
    { id: "def-1", src: img1, alt: "Gallery 1" },
    { id: "def-2", src: img2, alt: "Gallery 2" },
    { id: "def-3", src: img3, alt: "Gallery 3" },
    { id: "def-4", src: img4, alt: "Gallery 4" },
    { id: "def-5", src: img5, alt: "Gallery 5" },
    { id: "def-6", src: img6, alt: "Gallery 6" },
    { id: "def-7", src: img7, alt: "Gallery 7" },
    { id: "def-8", src: img8, alt: "Gallery 8" },
    { id: "def-9", src: img9, alt: "Gallery 9" },
    { id: "def-10", src: img10, alt: "Gallery 10" },
    { id: "def-11", src: img11, alt: "Gallery 11" },
    { id: "def-12", src: img12, alt: "Gallery 12" },
];

const CONFIG_SLUG = "config-gallery";

interface GalleryItem {
    id: string;
    src: string;
    alt: string;
}

export const Gallery = () => {
    const [images, setImages] = useState<GalleryItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const minSwipeDistance = 50;

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const posts = await getPosts();
                const found = posts.find(p => p.slug === CONFIG_SLUG);
                if (found) {
                    const cleanJson = found.content.rendered.replace(/<[^>]*>?/gm, '');
                    const parsed = JSON.parse(cleanJson);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setImages(parsed);
                        return;
                    }
                }
            } catch (e) {
                console.error("Failed to fetch dynamic gallery", e);
            }

            // Fallback
            setImages(DEFAULT_IMAGES);
        };
        fetchGallery();
    }, []);

    const handleNext = useCallback(() => {
        setSelectedIndex((prev) =>
            prev === null ? null : (prev + 1) % images.length
        );
    }, [images.length]);

    const handlePrev = useCallback(() => {
        setSelectedIndex((prev) =>
            prev === null ? null : (prev - 1 + images.length) % images.length
        );
    }, [images.length]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (selectedIndex === null) return;

        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'Escape') setSelectedIndex(null);
    }, [selectedIndex, handleNext, handlePrev]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) handleNext();
        if (isRightSwipe) handlePrev();
    };

    if (images.length === 0) return null;

    return (
        <section className="py-20 bg-white overflow-hidden">
            <div className="container px-4 mx-auto">
                <div className="text-center mb-16 space-y-4 animate-fade-in">
                    <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary drop-shadow-sm">
                        Dišpet u akciji
                    </h2>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                        Pogledajte kako se zabavljamo i stvaramo uspomene!
                    </p>
                </div>

                <div className="relative group/gallery">
                    {/* Navigation Buttons (Desktop Hover) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-lg rounded-full -ml-4 opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300 hidden md:flex"
                        onClick={() => {
                            const container = document.getElementById('gallery-scroll-container');
                            if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
                        }}
                    >
                        <ChevronLeft className="w-6 h-6 text-primary" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-lg rounded-full -mr-4 opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300 hidden md:flex"
                        onClick={() => {
                            const container = document.getElementById('gallery-scroll-container');
                            if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
                        }}
                    >
                        <ChevronRight className="w-6 h-6 text-primary" />
                    </Button>

                    {/* Scrollable Container */}
                    <div
                        id="gallery-scroll-container"
                        className="flex gap-4 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {images.map((image, index) => (
                            <div
                                key={`${image.id}-${index}`}
                                className="relative group cursor-pointer overflow-hidden rounded-2xl flex-shrink-0 w-[280px] h-[280px] snap-center"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => setSelectedIndex(index)}
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full transform scale-50 group-hover:scale-100 transition-all duration-300 shadow-lg">
                                        <ChevronRight className="w-6 h-6 text-primary" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox Overlay */}
            {selectedIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
                    onClick={() => setSelectedIndex(null)}
                >
                    {/* Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 md:top-8 md:right-8 text-white hover:bg-white/20 w-12 h-12 rounded-full z-[110]"
                        onClick={() => setSelectedIndex(null)}
                    >
                        <X className="w-8 h-8" />
                    </Button>

                    {/* Navigation Buttons (Desktop) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:flex absolute left-4 md:left-8 text-white hover:bg-white/20 w-12 h-12 rounded-full z-[110]"
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:flex absolute right-4 md:right-8 text-white hover:bg-white/20 w-12 h-12 rounded-full z-[110]"
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    >
                        <ChevronRight className="w-8 h-8" />
                    </Button>

                    {/* Image Container */}
                    <div
                        className="relative w-full h-full flex items-center justify-center p-4 md:p-20"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        {/* Ensure selectedIndex is valid */}
                        {images[selectedIndex] && (
                            <>
                                <img
                                    src={images[selectedIndex].src}
                                    alt={images[selectedIndex].alt}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                                />

                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 bg-black/50 px-4 py-2 rounded-full text-sm backdrop-blur-md">
                                    {selectedIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};
