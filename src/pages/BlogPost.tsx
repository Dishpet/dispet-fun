import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHero } from "@/components/PageHero";
import rokoBlog from "@/assets/roko-blog.png";
import { getPostBySlug } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";

const BlogPost = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState<WPPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) return;
            try {
                const data = await getPostBySlug(slug);
                setPost(data);
            } catch (error) {
                console.error("Failed to fetch post:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <h2 className="text-3xl font-heading">Objava nije pronađena</h2>
                <Button onClick={() => navigate("/blog")}>Natrag na blog</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <PageHero title={post.title.rendered} characterImage={rokoBlog} />

            <section className="bg-white py-12 md:py-20">
                <div className="container px-4 max-w-4xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/blog")}
                        className="mb-8 hover:bg-gray-100"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Natrag na blog
                    </Button>

                    <article className="prose prose-lg max-w-none text-center mx-auto">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
                            <Calendar className="w-5 h-5" />
                            {format(new Date(post.date), 'd. MMMM yyyy.', { locale: hr })}
                        </div>

                        {post._embedded?.['wp:featuredmedia']?.[0]?.source_url && (
                            <img
                                src={post._embedded['wp:featuredmedia'][0].source_url}
                                alt={post.title.rendered}
                                className="w-full h-auto rounded-2xl shadow-lg mb-8"
                            />
                        )}

                        <div dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
                    </article>
                </div>
            </section>
        </div>
    );
};

export default BlogPost;
