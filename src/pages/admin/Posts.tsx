import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Loader2, Calendar, FileText, Globe, X, ChevronRight } from "lucide-react";
import { getPosts, deletePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { PostEditor } from "@/components/admin/PostEditor";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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
                title: "Greška",
                description: "Nije uspjelo učitavanje objava.",
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
        if (!confirm("Jeste li sigurni da želite obrisati ovu objavu?")) return;

        try {
            await deletePost(id);
            setPosts(posts.filter(post => post.id !== id));
            toast({ title: "Uspjeh", description: "Objava je uspješno obrisana" });
        } catch (error) {
            toast({ title: "Greška", description: "Nije uspjelo brisanje objave", variant: "destructive" });
        }
    };

    const handleEdit = (post: WPPost) => {
        setSelectedPost(post);
        setIsCreateOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleCreate = () => {
        if (isCreateOpen) {
            setIsCreateOpen(false);
            setSelectedPost(null);
        } else {
            setSelectedPost(null);
            setIsCreateOpen(true);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            {/* Header Section */}
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-8">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                        BLOG OBJAVE
                    </h1>
                    <p className="text-slate-500 text-sm md:text-lg font-medium mt-1">
                        Kreirajte, uredite i upravljajte blog sadržajem.
                    </p>
                </div>
                <Button
                    onClick={toggleCreate}
                    className={cn(
                        "h-12 w-full md:w-auto px-6 rounded-full font-black text-xs uppercase tracking-widest shadow-lg transition-all shadow-primary/10",
                        isCreateOpen ? "bg-slate-900" : "bg-primary"
                    )}
                >
                    {isCreateOpen ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isCreateOpen ? "Zatvori Editor" : "Nova Objava"}
                </Button>
            </div>

            {/* Inline Editor */}
            <Collapsible open={isCreateOpen}>
                <CollapsibleContent>
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden mb-12">
                        <div className="p-4 md:p-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                    {selectedPost ? 'Uredi Objavu' : 'Nova Blog Objava'}
                                </h3>
                                <Badge variant="secondary" className="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[9px] px-3 py-1">WordPress Editor</Badge>
                            </div>

                            <PostEditor
                                post={selectedPost}
                                onSuccess={() => {
                                    setIsCreateOpen(false);
                                    setSelectedPost(null);
                                    fetchPosts();
                                }}
                            />
                        </div>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            {/* Posts Grid */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 animate-pulse gap-4">
                        <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Učitavanje objava...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Card key={post.id} className="group hover:shadow-xl hover:shadow-slate-300/40 transition-all duration-500 border-none bg-white flex flex-col overflow-hidden rounded-[2.5rem] shadow-lg shadow-slate-200/30">
                                {post._embedded?.['wp:featuredmedia']?.[0]?.source_url ? (
                                    <div className="h-64 w-full bg-slate-100 overflow-hidden relative">
                                        <img
                                            src={post._embedded['wp:featuredmedia'][0].source_url}
                                            alt="Featured"
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className="absolute top-6 right-6">
                                            <Badge className="bg-slate-900/80 backdrop-blur-md text-white border-none shadow-xl font-black text-[9px] uppercase tracking-[0.2em] px-4 py-2 rounded-full">Published</Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-64 w-full bg-slate-50 flex items-center justify-center relative border-b border-slate-100">
                                        <FileText className="w-12 h-12 text-slate-200" />
                                        <div className="absolute top-6 right-6">
                                            <Badge className="bg-slate-400/80 backdrop-blur-md text-white border-none shadow-xl font-black text-[9px] uppercase tracking-[0.2em] px-4 py-2 rounded-full">No Image</Badge>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 md:p-10 flex-1 flex flex-col">
                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                            <Calendar className="w-3.5 h-3.5" />
                                        </div>
                                        {new Date(post.date).toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>

                                    <h3
                                        className="text-2xl font-black mb-4 line-clamp-2 leading-tight tracking-tight text-slate-900 group-hover:text-primary transition-colors cursor-pointer"
                                        dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                                        onClick={() => handleEdit(post)}
                                    />

                                    <div
                                        className="text-slate-500 text-sm font-medium line-clamp-3 mb-10 flex-1 leading-relaxed opacity-80"
                                        dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                                    />

                                    <div className="flex items-center justify-between pt-8 border-t border-slate-50 mt-auto">
                                        <a
                                            href={`https://wp.dispet.fun/${post.slug}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary flex items-center gap-2.5 transition-all group/link"
                                        >
                                            <Globe className="w-4 h-4 opacity-50 group-hover/link:rotate-12 transition-transform" /> Web Pregled
                                        </a>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-11 w-11 p-0 rounded-full bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-600 transition-all shadow-sm"
                                                onClick={() => handleEdit(post)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-11 w-11 p-0 rounded-full bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 transition-all shadow-sm"
                                                onClick={() => handleDelete(post.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
                {!loading && posts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-40 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm">
                        <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-8 shadow-inner">
                            <FileText className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">NEMA OBJAVA</h3>
                        <p className="text-slate-500 max-w-xs mt-3 font-medium leading-relaxed">
                            Započnite pisanjem vaše prve blog objave klikom na gumb iznad.
                        </p>
                        <Button onClick={toggleCreate} variant="outline" className="mt-8 rounded-full px-8 py-6 h-auto font-black text-[10px] uppercase tracking-widest">
                            Kreiraj prvu objavu
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Posts;
