import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Save } from "lucide-react";
import { getPosts, createPost, updatePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { MediaPicker } from "@/components/admin/MediaPicker";

// Import all gallery images (32 new webp images) as fallback
const galleryImages = import.meta.glob("@/assets/gallery/dispet galerija (*).webp", { eager: true, import: 'default' });

const DEFAULT_GALLERY = Object.entries(galleryImages)
    .sort((a, b) => {
        const numA = parseInt(a[0].match(/\((\d+)\)/)?.[1] || "0");
        const numB = parseInt(b[0].match(/\((\d+)\)/)?.[1] || "0");
        return numA - numB;
    })
    .map(([path, src], index) => ({
        id: `def-${index + 1}`,
        src: src as string,
        alt: `Gallery image ${index + 1}`
    }));

const CONFIG_SLUG = "config-gallery";

interface GalleryItem {
    id: string; // Unique ID
    src: string;
    alt: string;
}

export default function AdminGallery() {
    const [configPost, setConfigPost] = useState<WPPost | null>(null);
    const [images, setImages] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const posts = await getPosts();
            const found = posts.find(p => p.slug === CONFIG_SLUG);

            if (found) {
                setConfigPost(found);
                try {
                    const cleanJson = found.content.rendered.replace(/<[^>]*>?/gm, '');
                    const parsed = JSON.parse(cleanJson);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setImages(parsed);
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse gallery config", e);
                }
            }

            // Fallback
            setImages(DEFAULT_GALLERY);

        } catch (error) {
            console.error(error);
            setImages(DEFAULT_GALLERY);
            toast({ title: "Error", description: "Failed to load gallery config", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async (newImages: GalleryItem[]) => {
        setSaving(true);
        const jsonString = JSON.stringify(newImages);

        try {
            if (configPost) {
                await updatePost(configPost.id, {
                    content: jsonString,
                });
                toast({ title: "Saved", description: "Gallery updated." });
            } else {
                const newPost = await createPost({
                    title: "System Config: Gallery",
                    content: jsonString,
                    slug: CONFIG_SLUG,
                    status: 'private'
                });
                setConfigPost(newPost);
                toast({ title: "Created", description: "Gallery initialized." });
            }
            setImages(newImages);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleSelectMedia = (mediaList: any) => {
        const newItems: GalleryItem[] = [];
        const list = Array.isArray(mediaList) ? mediaList : [mediaList];

        list.forEach((m: any) => {
            newItems.push({
                id: crypto.randomUUID(),
                src: m.source_url,
                alt: m.alt_text || m.title?.rendered || "Gallery Image"
            });
        });

        const updated = [...images, ...newItems];
        saveConfig(updated);
    };

    const handleDelete = (id: string) => {
        if (!confirm("Remove image?")) return;
        const updated = images.filter(img => img.id !== id);
        saveConfig(updated);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gallery Settings</h2>
                    <p className="text-sm text-gray-500">Manage images in the "Dišpet u akciji" section.</p>
                </div>
                <div>
                    <MediaPicker
                        value={[]}
                        onChange={() => { }}
                        onSelectMedia={handleSelectMedia}
                        multiple={true}
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((img) => (
                        <div key={img.id} className="relative aspect-square group rounded-xl overflow-hidden border bg-gray-100">
                            <img
                                src={img.src}
                                alt={img.alt}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="destructive" size="icon" onClick={() => handleDelete(img.id)}>
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {images.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl bg-gray-50 text-gray-400">
                            <p>Gallery is empty.</p>
                            <p className="text-sm">Click "Select Image(s)" to add photos.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
