import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
        <Card className="mb-6 overflow-hidden border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2rem] transition-all hover:shadow-2xl hover:shadow-primary/5 group">
            <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Image */}
                <div className="h-24 w-24 rounded-3xl bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-500">
                    {product.images?.[0] ? (
                        <img src={product.images[0].src} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                            <Package className="w-10 h-10 opacity-50" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant={product.stock_status === 'instock' ? 'default' : 'destructive'} className="text-[10px] uppercase tracking-tighter font-black px-2.5 py-1 rounded-full">
                            {product.stock_status === 'instock' ? 'Dostupno' : 'Rasprodano'}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {product.id}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 truncate leading-tight mb-1">{product.name}</h3>
                    <p className="text-lg font-bold text-primary italic">€{product.price}</p>
                </div>

                {/* Stock Input (Simple Product) */}
                {!isVariable && (
                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            Zaliha
                        </label>
                        <div className="relative">
                            <Input
                                type="number"
                                className="w-full h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-colors font-bold pl-4"
                                value={stockQuantity}
                                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                    {isVariable && (
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={handleFetchVariations}
                            className="flex-1 lg:flex-none gap-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-900 border-none transition-all shadow-sm"
                        >
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Varijacije
                        </Button>
                    )}

                    <div className="flex gap-2 ml-auto lg:ml-0">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-xl border-slate-100 hover:border-blue-100 hover:bg-blue-50 text-blue-600 transition-all shadow-sm"
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-xl border-slate-100 hover:border-red-100 hover:bg-red-50 text-red-600 transition-all shadow-sm"
                            onClick={() => onDelete(product.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            size="lg"
                            className={cn(
                                "h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all",
                                saving ? "opacity-70" : "hover:shadow-primary/30"
                            )}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Spremi
                        </Button>
                    </div>
                </div>
            </div>

            {/* Variations Collapsible */}
            <Collapsible open={isOpen} className="bg-slate-50/50 border-t border-slate-100">
                <CollapsibleContent>
                    <div className="p-8 space-y-4">
                        {loadingVariations ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Učitavanje varijacija...</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-12 gap-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                                    <div className="col-span-8">Varijacija</div>
                                    <div className="col-span-4 pl-4 text-center">Zaliha</div>
                                </div>
                                <div className="space-y-3">
                                    {variations.map((v) => (
                                        <div key={v.id} className="grid grid-cols-12 gap-8 items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-primary/20 transition-all group/var">
                                            <div className="col-span-8 flex flex-col">
                                                <div className="flex items-center gap-3">
                                                    {(() => {
                                                        const colorAttr = v.attributes?.find((a: any) => COLOR_MAP[a.option]);
                                                        const hex = colorAttr ? COLOR_MAP[colorAttr.option] : null;
                                                        return hex ? (
                                                            <div
                                                                className="w-4 h-4 rounded-full border border-slate-200 shadow-inner shrink-0 scale-110"
                                                                style={{ backgroundColor: hex }}
                                                            />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full border border-slate-200 bg-slate-100 shrink-0" />
                                                        );
                                                    })()}
                                                    <span className="font-bold text-slate-900 text-sm">
                                                        {v.attributes.map((a: any) => `${a.option}`).join(' / ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5 ml-7 text-[10px] font-bold text-slate-400">
                                                    <span className="uppercase tracking-widest">ID: {v.id}</span>
                                                    <span className="text-primary italic">€{v.price}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-4">
                                                <Input
                                                    type="number"
                                                    className="h-10 rounded-xl bg-slate-50 text-center border-none font-bold focus:bg-white transition-all"
                                                    value={variationStock[v.id] || 0}
                                                    onChange={(e) => setVariationStock(prev => ({ ...prev, [v.id]: parseInt(e.target.value) || 0 }))}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
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

    const filteredProducts = (products || []).filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-8">
                <div>
                    <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                        PROIZVODI
                    </h1>
                    <p className="text-slate-500 text-lg font-medium mt-1">Upravljajte svojim proizvodima i zalihama.</p>
                </div>
                <div className="flex gap-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-wider border-slate-200 hover:bg-slate-50 transition-all">
                                Atributi
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                            <AttributeSync />
                        </DialogContent>
                    </Dialog>
                    <Button
                        onClick={() => navigate("/admin/products/new")}
                        className="h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2 stroke-[3]" /> Novi Proizvod
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 max-w-xl group focus-within:border-primary/30 transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-2 group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Pretraži proizvode..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0 text-slate-900 font-bold placeholder:text-slate-300 text-base"
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
