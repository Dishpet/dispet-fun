import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Save, Image as ImageIcon, Plus, X } from "lucide-react";
import { getPosts, createPost, updatePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { cleanWordPressJson, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    id: string;
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
                const parsed = cleanWordPressJson(found.content.rendered);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setImages(parsed);
                    setLoading(false);
                    return;
                }
            }
            setImages(DEFAULT_GALLERY);
        } catch (error) {
            console.error(error);
            setImages(DEFAULT_GALLERY);
            toast({ title: "Greška", description: "Neuspješno učitavanje galerije.", variant: "destructive" });
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
                toast({ title: "Spremljeno", description: "Galerija je uspješno ažurirana." });
            } else {
                const newPost = await createPost({
                    title: "System Config: Gallery",
                    content: jsonString,
                    slug: CONFIG_SLUG,
                    status: 'private'
                });
                setConfigPost(newPost);
                toast({ title: "Kreirano", description: "Konfiguracija galerije je inicijalizirana." });
            }
            setImages(newImages);
        } catch (error) {
            console.error(error);
            toast({ title: "Greška", description: "Pokušaj spremanja nije uspio.", variant: "destructive" });
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
        if (!confirm("Jeste li sigurni da želite ukloniti ovu sliku?")) return;
        const updated = images.filter(img => img.id !== id);
        saveConfig(updated);
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-8">
                <div>
                    <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                        GALERIJA
                    </h1>
                    <p className="text-slate-500 text-lg font-medium mt-1">Upravljajte slikama u "Dišpet u akciji" sekciji.</p>
                </div>
                <div className="flex items-center gap-3">
                    {saving && (
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary animate-pulse mr-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Spremanje...
                        </div>
                    )}
                    <MediaPicker
                        value={[]}
                        onChange={() => { }}
                        onSelectMedia={handleSelectMedia}
                        multiple={true}
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Učitavanje fotografija...</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {images.map((img) => (
                        <Card key={img.id} className="group relative aspect-square overflow-hidden border-none shadow-lg shadow-slate-200/40 bg-white rounded-[2.5rem] transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                            <img
                                src={img.src}
                                alt={img.alt}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-between p-6">
                                <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-bold uppercase text-[9px] tracking-widest hidden sm:flex">
                                    IMAGE
                                </Badge>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDelete(img.id)}
                                    className="h-10 w-10 rounded-full bg-orange-600 hover:bg-orange-500 border-none shadow-xl"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                    {images.length === 0 && (
                        <div className="col-span-full py-40 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                            <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                                <ImageIcon className="h-10 w-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Galerija je prazna</h3>
                            <p className="text-slate-400 font-medium mt-2">Kliknite na gumb iznad za dodavanje fotografija.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
