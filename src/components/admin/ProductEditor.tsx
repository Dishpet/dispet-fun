import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct, updateProduct } from "@/integrations/wordpress/woocommerce";
import { WCProduct } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Image as ImageIcon, Box, List, Tag, Info, ShoppingBag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPicker } from "./MediaPicker";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VariationManager } from "./VariationManager";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductEditorProps {
    product?: WCProduct | null;
    initialImage?: string;
    onSuccess: () => void;
}

export const ProductEditor = ({ product, initialImage, onSuccess }: ProductEditorProps) => {
    // Form State
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [regularPrice, setRegularPrice] = useState("");
    const [description, setDescription] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
    const [stockStatus, setStockStatus] = useState("instock");
    const [manageStock, setManageStock] = useState(false);
    const [stockQuantity, setStockQuantity] = useState(0);
    const [productType, setProductType] = useState<'simple' | 'variable'>('simple');

    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        if (product) {
            setName(product.name);
            setPrice(product.sale_price || "");
            setRegularPrice(product.regular_price || product.price); // Fallback
            setDescription(product.description);
            setShortDescription(product.short_description);
            setImageUrl(product.images?.[0]?.src || "");

            // Handle Gallery
            const images = product.images || [];
            if (images.length > 1) {
                setGalleryUrls(images.slice(1).map(img => img.src));
            } else {
                setGalleryUrls([]);
            }

            setStockStatus(product.stock_status);
            setManageStock(product.manage_stock);
            setStockQuantity(product.stock_quantity ?? 0);
            setProductType(product.type === 'variable' ? 'variable' : 'simple');
        } else {
            // Defaults for new product
            setName("");
            setPrice("");
            setRegularPrice("");
            setDescription("");
            setShortDescription("");
            setImageUrl(initialImage || "");
            setGalleryUrls([]);
            setStockStatus("instock");
            setManageStock(true);
            setStockQuantity(0);
            setProductType('simple');
        }
    }, [product, initialImage]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);

        const allImages = [];
        if (imageUrl) allImages.push({ src: imageUrl });
        if (galleryUrls.length > 0) {
            galleryUrls.forEach(url => allImages.push({ src: url }));
        }

        const data: any = {
            name,
            regular_price: regularPrice,
            description,
            short_description: shortDescription,
            stock_status: stockStatus,
            manage_stock: manageStock,
            images: allImages,
            type: productType
        };

        if (manageStock && productType === 'simple') {
            data.stock_quantity = stockQuantity;
        }

        if (price) {
            data.sale_price = price !== regularPrice ? price : '';
        }

        try {
            if (product) {
                await updateProduct(product.id, data);
                toast({ title: "Success", description: "Product updated successfully" });
            } else {
                await createProduct(data);
                toast({ title: "Success", description: "Product created successfully" });
            }
            onSuccess();
        } catch (error) {
            console.error("Product save error:", error);
            toast({
                title: "Error",
                description: "Failed to save product. Check permissions.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-32 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 mb-8 sticky top-4 z-40 gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 font-heading uppercase tracking-tight">
                            {product ? name : 'Novi Proizvod'}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-200 text-slate-400">
                                {productType === 'variable' ? 'Varijabilni' : 'Jednostavni'}
                            </Badge>
                            {product && (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {product.id}</span>
                            )}
                        </div>
                    </div>
                </div>
                <Button
                    onClick={() => handleSubmit()}
                    disabled={loading}
                    className="w-full sm:w-auto px-8 h-12 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2 stroke-[3]" />}
                    Spremi Promjene
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto mb-10 bg-slate-100/50 p-2 rounded-full gap-2">
                    <TabsTrigger
                        value="general"
                        className="rounded-full h-12 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all"
                    >
                        <Tag className="w-4 h-4 mr-2" /> Opće
                    </TabsTrigger>
                    <TabsTrigger
                        value="inventory"
                        className="rounded-full h-12 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all"
                    >
                        <Box className="w-4 h-4 mr-2" /> Zaliha
                    </TabsTrigger>
                    <TabsTrigger
                        value="media"
                        className="rounded-full h-12 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all"
                    >
                        <ImageIcon className="w-4 h-4 mr-2" /> Mediji
                    </TabsTrigger>
                    <TabsTrigger
                        value="variations"
                        disabled={productType !== 'variable'}
                        className="rounded-full h-12 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all disabled:opacity-30"
                    >
                        <List className="w-4 h-4 mr-2" /> Varijacije
                    </TabsTrigger>
                </TabsList>

                {/* GENERAL TAB */}
                <TabsContent value="general" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Product identity and pricing</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Product Name</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Vintage T-Shirt"
                                        className="text-lg font-medium rounded-full px-6"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Product Type</Label>
                                    <Select value={productType} onValueChange={(val: any) => setProductType(val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="simple">Simple Product</SelectItem>
                                            <SelectItem value="variable">Variable Product (Sizes/Colors)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {productType === 'simple' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border">
                                    <div className="space-y-2">
                                        <Label>Regular Price (€)</Label>
                                        <Input
                                            type="number"
                                            value={regularPrice}
                                            onChange={(e) => setRegularPrice(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sale Price (€) <span className="text-gray-400 font-normal">(Optional)</span></Label>
                                        <Input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 mb-6">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        Variable Product Pricing
                                    </h4>
                                    <p className="text-sm mt-1 opacity-90">
                                        Prices for variable products are managed in the <strong>Variations</strong> tab.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Short Description</Label>
                                <div className="h-44 mb-8">
                                    <ReactQuill theme="snow" value={shortDescription} onChange={setShortDescription} className="h-32 bg-white" />
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <Label>Full Description</Label>
                                <div className="h-80 mb-8">
                                    <ReactQuill theme="snow" value={description} onChange={setDescription} className="h-64 bg-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>


                {/* INVENTORY TAB */}
                <TabsContent value="inventory" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory Management</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                <div>
                                    <Label className="text-base">Manage Stock Level</Label>
                                    <p className="text-sm text-gray-500">Enable stock management at product level</p>
                                </div>
                                <Switch checked={manageStock} onCheckedChange={setManageStock} />
                            </div>

                            {manageStock && productType === 'simple' && (
                                <div className="space-y-2">
                                    <Label>Stock Quantity</Label>
                                    <Input
                                        type="number"
                                        value={stockQuantity}
                                        onChange={(e) => setStockQuantity(parseInt(e.target.value))}
                                        className="max-w-xs"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Stock Status</Label>
                                <Select value={stockStatus} onValueChange={setStockStatus}>
                                    <SelectTrigger className="max-w-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="instock">In Stock</SelectItem>
                                        <SelectItem value="outofstock">Out of Stock</SelectItem>
                                        <SelectItem value="onbackorder">On Backorder</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* MEDIA TAB */}
                <TabsContent value="media" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Images</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Main Product Image</Label>
                                <MediaPicker value={imageUrl} onChange={setImageUrl} />
                            </div>
                            <div className="space-y-2">
                                <Label>Gallery Images</Label>
                                <MediaPicker value={galleryUrls} onChange={setGalleryUrls} multiple />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* VARIATIONS TAB */}
                <TabsContent value="variations" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card>
                        <CardHeader>
                            <CardTitle>Variations</CardTitle>
                            <CardDescription>Manage stock and prices for each variation (Size, Color, etc.)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {product && productType === 'variable' ? (
                                product.type === 'variable' ? (
                                    <VariationManager productId={product.id} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-full">
                                            <Save className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Save Changes First</h3>
                                            <p className="text-gray-500 max-w-sm mx-auto">
                                                You've changed the product type to Variable. Please save the product to enable variation management.
                                            </p>
                                        </div>
                                        <Button onClick={() => handleSubmit()} disabled={loading}>
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save & Continue"}
                                        </Button>
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Set product type to "Variable Product" under General tab to manage variations.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
