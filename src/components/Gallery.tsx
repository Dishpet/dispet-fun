import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPosts } from "@/integrations/wordpress/posts";
import { motion, AnimatePresence } from "framer-motion";

// Import all gallery images (32 new webp images)
const galleryImages = import.meta.glob("@/assets/gallery/dispet galerija (*).webp", { eager: true, import: 'default' });
// Import all gallery videos
const galleryVideos = import.meta.glob([
    "@/assets/gallery/*.webm",
    "@/assets/gallery/*.mp4"
], { eager: true, import: 'default' });

interface GalleryItem {
    id: string;
    src: string;
    alt: string;
    type: 'image' | 'video';
}

const DEFAULT_IMAGES: GalleryItem[] = Object.entries(galleryImages)
    .sort((a, b) => {
        const numA = parseInt(a[0].match(/\((\d+)\)/)?.[1] || "0");
        const numB = parseInt(b[0].match(/\((\d+)\)/)?.[1] || "0");
        return numA - numB;
    })
    .map(([path, src], index) => ({
        id: `img-${index + 1}`,
        src: src as string,
        alt: `Gallery Image ${index + 1}`,
        type: 'image'
    }));

const DEFAULT_VIDEOS: GalleryItem[] = Object.entries(galleryVideos)
    .filter(([path]) => !path.includes("zvoncac (3)") && !path.includes("zvoncac (1)")) // Remove short videos
    .map(([path, src], index) => ({
        id: `vid-${index + 1}`,
        src: src as string,
        alt: `Gallery Video ${index + 1}`,
        type: 'video'
    }));

const CONFIG_SLUG = "config-gallery";

const MediaElement = ({ item, isLightbox = false, onLoaded }: { item: GalleryItem, isLightbox?: boolean, onLoaded?: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoLoaded, setVideoLoaded] = useState(false);

    const handleLoadedData = () => {
        setVideoLoaded(true);
        if (onLoaded) onLoaded();
    };

    if (item.type === 'video') {
        return (
            <div className="relative w-full h-full bg-gray-100">
                <video
                    ref={videoRef}
                    src={item.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onLoadedData={handleLoadedData}
                    className={`w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
                {!isLightbox && videoLoaded && (
                    <div className="absolute top-2 right-2 bg-black/40 p-1.5 rounded-full backdrop-blur-sm">
                        <Play className="w-3 h-3 text-white fill-current" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <img
            src={item.src}
            alt={item.alt}
            onLoad={onLoaded}
            className="w-full h-full object-cover"
        />
    );
};

const MarqueeRow = ({ items, direction = "left", speed = 40, onMediaClick }: { items: GalleryItem[], direction?: "left" | "right", speed?: number, onMediaClick: (id: string) => void }) => {
    const duplicatedItems = [...items, ...items, ...items];

    return (
        <div className="flex overflow-hidden py-4">
            <motion.div
                className="flex gap-4 flex-nowrap"
                animate={{
                    x: direction === "left" ? ["0%", "-33.33%"] : ["-33.33%", "0%"]
                }}
                transition={{
                    duration: speed,
                    ease: "linear",
                    repeat: Infinity,
                }}
            >
                {duplicatedItems.map((item, idx) => (
                    <div
                        key={`${item.id}-${idx}`}
                        className="relative w-[160px] h-[120px] md:w-[380px] md:h-[280px] flex-shrink-0 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 group cursor-pointer border-4 border-transparent hover:border-[#e83e70]"
                        onClick={() => onMediaClick(item.id)}
                    >
                        <MediaElement item={item} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:bg-black/0 transition-colors" />
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export const Gallery = () => {
    const [items, setItems] = useState<GalleryItem[]>(DEFAULT_IMAGES);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Track which rows already have a video
    const rowsWithVideo = useRef<Set<number>>(new Set());
    const loadedCount = useRef(0);

    const minSwipeDistance = 50;

    useEffect(() => {
        // Clear refs on mount/remount
        rowsWithVideo.current.clear();
        loadedCount.current = 0;

        DEFAULT_VIDEOS.forEach(video => {
            const v = document.createElement('video');
            v.src = video.src;
            v.preload = 'auto';
            v.onloadeddata = () => {
                setItems(prevItems => {
                    // Check if we already have 3 videos (one for each row)
                    if (rowsWithVideo.current.size >= 3) return prevItems;
                    if (prevItems.some(i => i.id === video.id)) return prevItems;

                    const newItems = [...prevItems];
                    const numItems = newItems.length;
                    const rowSize = Math.ceil(numItems / 3);

                    // Try to find a row that doesn't have a video yet
                    let targetRow = -1;
                    if (!rowsWithVideo.current.has(0)) targetRow = 0;
                    else if (!rowsWithVideo.current.has(1)) targetRow = 1;
                    else if (!rowsWithVideo.current.has(2)) targetRow = 2;

                    if (targetRow !== -1) {
                        rowsWithVideo.current.add(targetRow);
                        // Insert at a random position within that row's range
                        const start = targetRow * rowSize;
                        const end = Math.min((targetRow + 1) * rowSize, numItems);
                        const pos = start + Math.floor(Math.random() * (end - start));
                        newItems.splice(pos, 0, video);
                    }

                    return newItems;
                });
            };
        });
    }, []);

    const handleNext = useCallback(() => {
        setSelectedIndex((prev) =>
            prev === null ? null : (prev + 1) % items.length
        );
    }, [items.length]);

    const handlePrev = useCallback(() => {
        setSelectedIndex((prev) =>
            prev === null ? null : (prev - 1 + items.length) % items.length
        );
    }, [items.length]);

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

    if (items.length === 0) return null;

    // Distribute items across rows
    const row1 = items.slice(0, Math.ceil(items.length / 3));
    const row2 = items.slice(Math.ceil(items.length / 3), Math.ceil(items.length * 2 / 3));
    const row3 = items.slice(Math.ceil(items.length * 2 / 3));

    const handleMediaClick = (id: string) => {
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) setSelectedIndex(index);
    };

    return (
        <section className="py-24 bg-white overflow-hidden relative">
            <div className="container px-4 mx-auto relative z-10 pointer-events-none mb-12">
                <div className="text-center space-y-4">
                    <h2 className="text-5xl md:text-7xl font-['DynaPuff'] font-black text-[#43bfe6] drop-shadow-sm tracking-tight">
                        Dišpet u akciji
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto">
                        Trenutci zabave, sporta i zajedništva!
                    </p>
                </div>
            </div>

            {/* Tilted Marquee Container */}
            <div className="relative w-full overflow-hidden py-20">
                <div
                    className="relative w-[150%] -ml-[25%] space-y-4 md:space-y-8 pointer-events-auto origin-center"
                    style={{
                        transform: "rotateZ(-5deg)"
                    }}
                >
                    <MarqueeRow items={row1} direction="left" speed={120} onMediaClick={handleMediaClick} />
                    <MarqueeRow items={row2} direction="right" speed={200} onMediaClick={handleMediaClick} />
                    <MarqueeRow items={row3} direction="left" speed={160} onMediaClick={handleMediaClick} />
                </div>
            </div>

            {/* Gradients Overlay for depth */}
            <div className="absolute inset-y-0 left-0 w-24 md:w-64 bg-gradient-to-r from-white via-white/10 to-transparent z-20" />
            <div className="absolute inset-y-0 right-0 w-24 md:w-64 bg-gradient-to-l from-white via-white/10 to-transparent z-20" />

            {/* Lightbox Overlay */}
            <AnimatePresence>
                {selectedIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-sm flex items-center justify-center p-2 md:p-8"
                        onClick={() => setSelectedIndex(null)}
                    >
                        {/* Global Navigation & Close - Fixed Position */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="fixed top-4 right-4 z-[120] text-white bg-black/20 hover:bg-black/40 rounded-full w-10 h-10 md:w-12 md:h-12 backdrop-blur-md"
                            onClick={(e) => { e.stopPropagation(); setSelectedIndex(null); }}
                        >
                            <X className="w-6 h-6 md:w-8 h-8" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="fixed left-2 md:left-8 top-1/2 -translate-y-1/2 z-[120] text-white bg-black/20 hover:bg-black/40 rounded-full w-10 h-10 md:w-12 md:h-12 backdrop-blur-md"
                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        >
                            <ChevronLeft className="w-6 h-6 md:w-8 h-8" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="fixed right-2 md:right-8 top-1/2 -translate-y-1/2 z-[120] text-white bg-black/20 hover:bg-black/40 rounded-full w-10 h-10 md:w-12 md:h-12 backdrop-blur-md"
                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        >
                            <ChevronRight className="w-6 h-6 md:w-8 h-8" />
                        </Button>

                        {/* Image Container */}
                        <div
                            className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {items[selectedIndex] && (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative flex flex-col items-center justify-center w-full h-full pointer-events-auto"
                                >
                                    <div className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center">
                                        {items[selectedIndex].type === 'video' ? (
                                            <video
                                                src={items[selectedIndex].src}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                controls
                                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-black"
                                            />
                                        ) : (
                                            <img
                                                src={items[selectedIndex].src}
                                                alt={items[selectedIndex].alt}
                                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-black/20"
                                            />
                                        )}
                                    </div>

                                    <div className="mt-4 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md text-white/90 text-sm font-medium">
                                        {selectedIndex + 1} / {items.length}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};
