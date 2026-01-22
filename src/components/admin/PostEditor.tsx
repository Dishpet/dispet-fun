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
            setExcerpt(post.excerpt.rendered);
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter post title"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <div className="h-[300px] mb-12">
                    <ReactQuill
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        className="h-full"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                    id="excerpt"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Short summary..."
                />
            </div>

            <div className="space-y-2">
                <Label>Featured Image</Label>
                <MediaPicker
                    value={featuredMediaUrl}
                    onChange={setFeaturedMediaUrl}
                    onSelectMedia={(media) => setFeaturedMediaId(media.id)}
                />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (post ? "Update Post" : "Create Post")}
            </Button>
        </form>
    );
};
