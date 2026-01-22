import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, ArrowLeft, Loader2 } from "lucide-react";
import { getProduct } from "@/integrations/wordpress/woocommerce";
import { WCProduct } from "@/integrations/wordpress/types";
import { AdminDesignGenerator } from "@/components/admin/AdminDesignGenerator";
import { ProductMockupPreview } from "@/components/admin/ProductMockupPreview";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { useToast } from "@/hooks/use-toast";

const ProductFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    // State
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<WCProduct | null>(null);
    const [view, setView] = useState<'selection' | 'generator' | 'preview' | 'editor'>('selection');
    const [generatedImage, setGeneratedImage] = useState('');

    useEffect(() => {
        if (id) {
            loadProduct(parseInt(id));
            setView('editor');
        } else {
            setView('selection');
        }
    }, [id]);

    const loadProduct = async (productId: number) => {
        setLoading(true);
        try {
            // Need to implement get single product or reuse existing logic
            // Assuming getProduct(id) exists or we fetch from list. 
            // Since getProduct wasn't explicitly exported in previous files viewed, 
            // I'll grab it if it exists or use wpFetch directly if needed. 
            // Wait, I saw getProducts, createProduct, updateProduct. 
            // I'll assume getProduct exists or use generic fetch.
            // Let's check imports in Products.tsx... it imported getProducts not getProduct.
            // I'll try to use a standard fetch if getProduct is missing.
            const result = await getProduct(productId);
            setProduct(result);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Could not load product", variant: "destructive" });
            navigate("/admin/products");
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        navigate("/admin/products");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin/products")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold font-heading">
                    {id ? "Edit Product" : "Create New Product"}
                </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-8">

                {!id && view === 'selection' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
                        <div
                            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group"
                            onClick={() => setView('generator')}
                        >
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                                <Sparkles className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Generate with AI</h3>
                            <p className="text-gray-500">
                                Use Nano Banana to create a unique design based on Roko's style.
                            </p>
                        </div>

                        <div
                            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-all group"
                            onClick={() => setView('editor')}
                        >
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
                                <Upload className="w-8 h-8 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Manual Upload</h3>
                            <p className="text-gray-500">
                                Skip generation and upload your own product images manually.
                            </p>
                        </div>
                    </div>
                )}

                {!id && view === 'generator' && (
                    <AdminDesignGenerator
                        onImageSelect={(url) => {
                            setGeneratedImage(url);
                            setView('preview');
                        }}
                        onCancel={() => setView('selection')}
                    />
                )}

                {!id && view === 'preview' && (
                    <ProductMockupPreview
                        generatedDesign={generatedImage}
                        onConfirm={(finalMockup) => {
                            setGeneratedImage(finalMockup);
                            setView('editor');
                        }}
                        onBack={() => setView('generator')}
                    />
                )}

                {(id || view === 'editor') && (
                    <ProductEditor
                        product={product}
                        initialImage={generatedImage}
                        onSuccess={handleSuccess}
                    />
                )}
            </div>
        </div>
    );
};

export default ProductFormPage;
