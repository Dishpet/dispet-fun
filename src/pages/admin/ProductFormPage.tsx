import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, ArrowLeft, Loader2 } from "lucide-react";
import { getProduct } from "@/integrations/wordpress/woocommerce";
import { WCProduct } from "@/integrations/wordpress/types";
import { AdminDesignGenerator } from "@/components/admin/AdminDesignGenerator";
import { ProductMockupPreview } from "@/components/admin/ProductMockupPreview";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { Card } from "@/components/ui/card";
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
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/admin/products")} className="rounded-full h-12 w-12 border-slate-200 hover:bg-slate-50">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                            {id ? "UREDI PROIZVOD" : "NOVI PROIZVOD"}
                        </h1>
                        <p className="text-slate-500 text-lg font-medium mt-1">Konfigurirajte detalje proizvoda i zalihe.</p>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden">
                <div className="p-8 md:p-10">

                    {!id && view === 'selection' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
                            <div
                                className="border-2 border-dashed border-slate-100 rounded-[2rem] p-10 text-center hover:border-blue-500/30 hover:bg-blue-50/30 cursor-pointer transition-all group shadow-sm hover:shadow-md"
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
                                className="border-2 border-dashed border-slate-100 rounded-[2rem] p-10 text-center hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer transition-all group shadow-sm hover:shadow-md"
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
            </Card>
        </div>
    );
};

export default ProductFormPage;
