import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { getPosts, deletePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { PostEditor } from "@/components/admin/PostEditor";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
            const data = await getPosts(1, 100); // Fetch first 100 for now
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
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-heading">Posts</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setSelectedPost(null)}>
                            <Plus className="w-4 h-4 mr-2" /> New Post
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.map((post) => (
                                <TableRow key={post.id}>
                                    <TableCell className="font-medium">
                                        <div dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                                    </TableCell>
                                    <TableCell>{new Date(post.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                            Published
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedPost(post);
                                                setIsCreateOpen(true);
                                            }}
                                        >
                                            <Edit className="w-4 h-4 text-blue-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(post.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {posts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                        No posts found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </>
    );
};

export default Posts;
