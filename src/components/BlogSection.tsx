import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPosts } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";

export const BlogSection = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<WPPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await getPosts();
                setPosts(data.slice(0, 3)); // Get only the latest 3 posts
            } catch (error) {
                console.error("Failed to fetch posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return (
            <section className="py-20 bg-gray-50">
                <div className="container px-4 mx-auto flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </section>
        );
    }

    if (posts.length === 0) return null;

    return (
        <section className="py-20 bg-white relative overflow-hidden">
            {/* Decorative background elements removed for pure white background */}

            <div className="container px-4 mx-auto relative z-10">
                <div className="text-center mb-16 space-y-4 animate-fade-in">
                    <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary drop-shadow-sm">
                        Novosti iz Dišpeta
                    </h2>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                        Pratite naše najnovije avanture i događanja!
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {posts.map((post, index) => (
                        <Card
                            key={post.id}
                            className="overflow-hidden hover-lift shadow-soft group cursor-pointer flex flex-col h-full border-none bg-white/80 backdrop-blur-sm"
                            onClick={() => navigate(`/blog/${post.slug}`)}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {post._embedded?.['wp:featuredmedia']?.[0]?.source_url && (
                                <div className="aspect-video overflow-hidden relative">
                                    <img
                                        src={post._embedded['wp:featuredmedia'][0].source_url}
                                        alt={post.title.rendered}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <span className="text-white font-medium flex items-center gap-2">
                                            Pročitaj više <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex items-center gap-2 text-xs font-bold text-primary tracking-wider uppercase mb-3">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(post.date), 'd. MMMM yyyy.', { locale: hr })}
                                </div>
                                <h3 className="text-xl font-heading font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                                <div className="text-muted-foreground mb-4 line-clamp-3 text-sm flex-grow" dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigate("/blog")}
                        className="group border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
                    >
                        Sve novosti <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </section>
    );
};
