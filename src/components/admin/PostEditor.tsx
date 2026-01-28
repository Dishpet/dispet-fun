import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPost, updatePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { MediaPicker } from "./MediaPicker";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Quill modules for a better toolbar
const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image', 'code-block'],
        ['clean']
    ],
};

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image', 'code-block'
];

interface PostEditorProps {
    post?: WPPost | null;
    onSuccess: () => void;
}

export const PostEditor = ({ post, onSuccess }: PostEditorProps) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [featuredMediaId, setFeaturedMediaId] = useState<number>(0);
    const [featuredMediaUrl, setFeaturedMediaUrl] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (post) {
            setTitle(post.title.rendered);
            setContent(post.content.rendered);

            // Clean HTML from excerpt for better editing
            const cleanExcerpt = post.excerpt.rendered
                .replace(/<[^>]*>?/gm, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&hellip;/g, '...')
                .trim();
            setExcerpt(cleanExcerpt);

            setFeaturedMediaId(post.featured_media);
            const media = post._embedded?.['wp:featuredmedia']?.[0];
            if (media) setFeaturedMediaUrl(media.source_url);
        } else {
            setTitle("");
            setContent("");
            setExcerpt("");
            setFeaturedMediaId(0);
            setFeaturedMediaUrl("");
        }
    }, [post]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = {
            title,
            content,
            excerpt,
            status: 'publish',
            featured_media: featuredMediaId > 0 ? featuredMediaId : undefined
        };

        try {
            if (post) {
                await updatePost(post.id, data);
                toast({ title: "Success", description: "Post updated successfully" });
            } else {
                await createPost(data);
                toast({ title: "Success", description: "Post created successfully" });
            }
            onSuccess();
        } catch (error) {
            console.error("Post save error:", error);
            toast({
                title: "Error",
                description: "Failed to save post. Check permissions.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Post Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. 5 Tips for Outdoor Training"
                            required
                            className="text-lg font-medium py-6 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content" className="text-sm font-semibold text-gray-700">Body Content</Label>
                        <div className="min-h-[300px] lg:min-h-[400px] mb-14 lg:mb-12 border rounded-lg border-gray-200 overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/10">
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                modules={quillModules}
                                formats={quillFormats}
                                className="h-full border-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar area */}
                <div className="space-y-8 border-t pt-8 lg:pt-0 lg:border-t-0 lg:border-l lg:pl-8 border-gray-100 pb-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Featured Image</Label>
                        </div>
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-300 transition-colors hover:bg-gray-50">
                            <MediaPicker
                                value={featuredMediaUrl}
                                onChange={setFeaturedMediaUrl}
                                onSelectMedia={(media) => setFeaturedMediaId(media.id)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="excerpt" className="text-sm font-semibold text-gray-700 uppercase tracking-wider text-xs">Excerpt / Summary</Label>
                        <Textarea
                            id="excerpt"
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder="A brief summary for cards and search engines..."
                            className="min-h-[120px] resize-none border-gray-200 bg-white shadow-sm focus:border-primary focus:ring-primary/20"
                        />
                        <p className="text-[10px] text-gray-400">Short summary displayed on the blog listing page.</p>
                    </div>

                    <div className="pt-4 sticky bottom-0 bg-white/80 backdrop-blur-sm">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (post ? "Update & Sync Post" : "Publish New Post")}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};
