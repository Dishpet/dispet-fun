import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Loader2, Calendar, FileText, Globe } from "lucide-react";
import { getPosts, deletePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { PostEditor } from "@/components/admin/PostEditor";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const Posts = () => {
    const [posts, setPosts] = useState<WPPost[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<WPPost | null>(null);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const data = await getPosts(1, 100);
            setPosts(data);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
            toast({
                title: "Error",
                description: "Failed to load posts.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            await deletePost(id);
            setPosts(posts.filter(post => post.id !== id));
            toast({ title: "Success", description: "Post deleted successfully" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Blog Posts
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Create, edit, and manage your blog content.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setSelectedPost(null)} className="shadow-lg hover:shadow-xl transition-all">
                            <Plus className="w-4 h-4 mr-2" /> New Post
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-heading">
                                {selectedPost ? 'Edit Post' : 'Create New Post'}
                            </DialogTitle>
                        </DialogHeader>
                        <PostEditor
                            post={selectedPost}
                            onSuccess={() => {
                                setIsCreateOpen(false);
                                fetchPosts();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <FileText className="w-12 h-12 text-gray-200 mb-4" />
                        <p className="text-gray-400 font-medium">Loading posts...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <Card key={post.id} className="group hover:shadow-lg transition-all border-border/60 flex flex-col overflow-hidden">
                                {post._embedded?.['wp:featuredmedia']?.[0]?.source_url && (
                                    <div className="h-48 w-full bg-gray-100 overflow-hidden relative">
                                        <img
                                            src={post._embedded['wp:featuredmedia'][0].source_url}
                                            alt="Featured"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <Badge className="bg-white/90 text-black hover:bg-white border-0 shadow-sm">Published</Badge>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(post.date).toLocaleDateString()}
                                    </div>

                                    <h3
                                        className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors"
                                        dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                                    />

                                    <div
                                        className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1"
                                        dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                                    />

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                        <a
                                            href={`https://wp.dispet.fun/${post.slug}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-medium text-gray-500 hover:text-primary flex items-center gap-1"
                                        >
                                            <Globe className="w-3 h-3" /> View Live
                                        </a>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => {
                                                    setSelectedPost(post);
                                                    setIsCreateOpen(true);
                                                }}
                                            >
                                                <Edit className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-red-50"
                                                onClick={() => handleDelete(post.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
                {!loading && posts.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-lg border border-dashed col-span-full">
                        <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                            Start writing your blog by creating your first post.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Posts;
