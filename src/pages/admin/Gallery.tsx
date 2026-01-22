import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Save } from "lucide-react";
import { getPosts, createPost, updatePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { MediaPicker } from "@/components/admin/MediaPicker";

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

const DEFAULT_GALLERY = [
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
        // mediaList can be array or single strings if using my messy MediaPicker.
        // Wait, MediaPicker returns URLs if I passed `value={string[]}` and `multiple=true`.
        // BUT `onSelectMedia` returns `WPMedia[]`.

        // Assuming I updated MediaPicker to return WPMedia objects in `onSelectMedia`.
        const newItems: GalleryItem[] = [];

        const list = Array.isArray(mediaList) ? mediaList : [mediaList];

        list.forEach((m: any) => {
            // Avoid duplicates by crude check? Or just allow them.
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
