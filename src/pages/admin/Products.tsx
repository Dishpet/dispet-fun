import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Loader2, Save, ChevronDown, ChevronUp, Package, Search } from "lucide-react";
import { getProducts, updateProduct, getProductVariations, updateProductVariation } from "@/integrations/wordpress/woocommerce";
import { wpFetch, getAuthHeaders } from "@/integrations/wordpress/client";
import { WCProduct } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { AttributeSync } from "@/components/admin/AttributeSync";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const COLOR_MAP: Record<string, string> = {
    'Crna': '#231f20',
    'Siva': '#d1d5db',
    'Tirkizna': '#00ab98',
    'Cijan': '#00aeef',
    'Plava': '#387bbf',
    'Ljubičasta': '#8358a4',
    'Bijela': '#ffffff',
    'Roza': '#e78fab',
    'Mint': '#a1d7c0'
};

const ProductRow = ({ product, onDelete, onUpdate }: { product: WCProduct, onDelete: (id: number) => void, onUpdate: () => void }) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [variations, setVariations] = useState<any[]>([]);
    const [loadingVariations, setLoadingVariations] = useState(false);
    const [saving, setSaving] = useState(false);

    // Local state for stock management
    const [stockQuantity, setStockQuantity] = useState(product.stock_quantity || 0);
    const [variationStock, setVariationStock] = useState<{ [key: number]: number }>({});

    const isVariable = product.type === 'variable';

    const handleFetchVariations = async () => {
        if (!isOpen && isVariable && variations.length === 0) {
            setLoadingVariations(true);
            try {
                const data = await getProductVariations(product.id);
                setVariations(data);
                const stockMap: any = {};
                data.forEach((v: any) => {
                    stockMap[v.id] = v.stock_quantity || 0;
                });
                setVariationStock(stockMap);
            } catch (error) {
                console.error("Failed to fetch variations", error);
                toast({ title: "Error", description: "Failed to fetch variations", variant: "destructive" });
            } finally {
                setLoadingVariations(false);
            }
        }
        setIsOpen(!isOpen);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update main product if simple
            if (!isVariable) {
                await updateProduct(product.id, {
                    manage_stock: true,
                    stock_quantity: stockQuantity
                });
            }

            // Update variations
            if (isVariable && variations.length > 0) {
                await Promise.all(variations.map(v =>
                    updateProductVariation(product.id, v.id, {
                        manage_stock: true,
                        stock_quantity: variationStock[v.id]
                    })
                ));
            }

            toast({ title: "Success", description: "Stock updated successfully" });
            onUpdate(); // Trigger refresh
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to update stock", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="mb-4 overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all">
            <div className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* Image */}
                <div className="h-16 w-16 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden border">
                    {product.images?.[0] ? (
                        <img src={product.images[0].src} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <Package className="w-8 h-8 opacity-50" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant={product.stock_status === 'instock' ? 'default' : 'destructive'} className="text-xs px-2 py-0.5">
                            {product.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                        <span className="text-sm text-gray-500">ID: {product.id}</span>
                        <span className="text-sm font-medium text-gray-900">€{product.price}</span>
                    </div>
                </div>

                {/* Stock Input (Simple Product) */}
                {!isVariable && (
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-500 uppercase">Stock:</label>
                        <Input
                            type="number"
                            className="w-24 h-9"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                    {isVariable && (
                        <Button variant="outline" size="sm" onClick={handleFetchVariations} className="gap-2">
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Variations
                        </Button>
                    )}

                    <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/products/edit/${product.id}`)}>
                        <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>

                    <Button onClick={handleSave} disabled={saving} size="sm" className={saving ? "opacity-70" : ""}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Variations Collapsible */}
            <Collapsible open={isOpen} className="bg-gray-50/50 border-t">
                <CollapsibleContent>
                    <div className="p-4 space-y-3">
                        {loadingVariations ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-12 gap-4 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                    <div className="col-span-6 md:col-span-8">Variation</div>
                                    <div className="col-span-6 md:col-span-4">Stock</div>
                                </div>
                                {variations.map((v) => (
                                    <div key={v.id} className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-md border shadow-sm">
                                        <div className="col-span-6 md:col-span-8 flex flex-col">
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const colorAttr = v.attributes?.find((a: any) => COLOR_MAP[a.option]);
                                                    const hex = colorAttr ? COLOR_MAP[colorAttr.option] : null;
                                                    return hex ? (
                                                        <div
                                                            className="w-3 h-3 rounded-full border border-gray-300 shadow-sm shrink-0"
                                                            style={{ backgroundColor: hex }}
                                                        />
                                                    ) : null;
                                                })()}
                                                <span className="font-medium text-gray-900">
                                                    {v.attributes.map((a: any) => `${a.option}`).join(' / ')}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 ml-5">ID: {v.id} • €{v.price}</span>
                                        </div>
                                        <div className="col-span-6 md:col-span-4">
                                            <Input
                                                type="number"
                                                className="h-8"
                                                value={variationStock[v.id] || 0}
                                                onChange={(e) => setVariationStock(prev => ({ ...prev, [v.id]: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
};

const Products = () => {
    const [products, setProducts] = useState<WCProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchProducts = async () => {
        // Don't set loading to true on refresh to keep UI stable
        try {
            const data = await getProducts(1, 100);
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            toast({
                title: "Error",
                description: "Failed to load products.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            await wpFetch(`/wc/v3/products/${id}?force=true`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            setProducts(products.filter(p => p.id !== id));
            toast({ title: "Success", description: "Product deleted successfully" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Products
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Manage your catalog and stock inventory.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="shadow-sm hover:shadow-md transition-all">
                                Setup Attributes
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <AttributeSync />
                        </DialogContent>
                    </Dialog>
                    <Button onClick={() => navigate("/admin/products/new")} className="shadow-lg hover:shadow-xl transition-all">
                        <Plus className="w-4 h-4 mr-2" /> New Product
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm max-w-md">
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0"
                />
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <Package className="w-12 h-12 text-gray-200 mb-4" />
                        <p className="text-gray-400 font-medium">Loading inventory...</p>
                    </div>
                ) : (
                    <>
                        {filteredProducts.map((product) => (
                            <ProductRow
                                key={product.id}
                                product={product}
                                onDelete={handleDelete}
                                onUpdate={fetchProducts}
                            />
                        ))}
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-muted-foreground">No products found matching your search.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Products;
