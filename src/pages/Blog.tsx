import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHero } from "@/components/PageHero";
import rokoBlog from "@/assets/roko-blog.png";
import { getPosts } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";

const Blog = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<WPPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await getPosts();
                setPosts(data);
            } catch (error) {
                console.error("Failed to fetch posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    return (
        <div className="min-h-screen">
            <PageHero title="BLOG" characterImage={rokoBlog} />

            <section className="bg-white py-12 md:py-20">
                <div className="container px-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {posts.map((post) => (
                                <Card
                                    key={post.id}
                                    className="overflow-hidden hover-lift shadow-soft group cursor-pointer flex flex-col h-full"
                                    onClick={() => navigate(`/blog/${post.slug}`)}
                                >
                                    {post._embedded?.['wp:featuredmedia']?.[0]?.source_url && (
                                        <div className="aspect-video overflow-hidden">
                                            <img
                                                src={post._embedded['wp:featuredmedia'][0].source_url}
                                                alt={post.title.rendered}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </div>
                                    )}
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                            <Calendar className="w-4 h-4" />
                                            {format(new Date(post.date), 'd. MMMM yyyy.', { locale: hr })}
                                        </div>
                                        <h3 className="text-xl font-heading font-bold mb-3 line-clamp-2" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                                        <div className="text-muted-foreground mb-6 line-clamp-3 flex-grow" dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />

                                        <Button variant="outline" className="w-full border-2 group-hover:bg-primary group-hover:text-white transition-colors mt-auto">
                                            Pročitaj više <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <h3 className="text-2xl font-bold text-gray-400">Trenutno nema objava.</h3>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Blog;
