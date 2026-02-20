import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getProducts, getProductVariations } from "@/integrations/wordpress/woocommerce";
import { WCProduct } from "@/integrations/wordpress/types";
import {
    Loader2, Package, Plus, Save, Trash2, AlertTriangle,
    RefreshCw, Search, Palette, Ruler, Box, TrendingDown,
    ChevronDown, X, Check, Edit2, CloudDownload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";

// Color name → hex (matching Products tab exactly)
const COLOR_HEX_MAP: Record<string, string> = {
    'Crna': '#231f20',
    'Siva': '#d1d5db',
    'Tirkizna': '#00ab98',
    'Cijan': '#00aeef',
    'Plava': '#387bbf',
    'Ljubičasta': '#8358a4',
    'Bijela': '#ffffff',
    'Roza': '#e78fab',
    'Mint': '#a1d7c0',
};

// All colors used in Products tab
const ALL_COLORS = Object.keys(COLOR_HEX_MAP);

// All sizes used in Products tab (from WooCommerce)
const ALL_SIZES = ['6-8 g.', '8-10 g.', '10-12 g.', 'S', 'M', 'L', 'XL', '500ml', 'Univerzalna'];

function getColorHex(colorName: string): string {
    return COLOR_HEX_MAP[colorName] || '#eee';
}

interface InventoryItem {
    key: string;
    product_id: number;
    name: string;
    size: string;
    color: string;
    stock: number;
    total_sold: number;
    last_sold?: string;
    auto_created?: boolean;
    synced_from_wc?: boolean;
    wc_variation_id?: number;
    note?: string;
}

const Inventory = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
    const [outOfStock, setOutOfStock] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingStock, setEditingStock] = useState<{ [key: string]: number }>({});
    const [products, setProducts] = useState<WCProduct[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // New item dialog state
    const [newItem, setNewItem] = useState({ product_id: '', name: '', size: '', color: '', stock: '0', note: '' });
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [bulkMode, setBulkMode] = useState(false);

    // For bulk add
    const [selectedProduct, setSelectedProduct] = useState<WCProduct | null>(null);
    const [bulkSizes, setBulkSizes] = useState<string[]>([]);
    const [bulkColors, setBulkColors] = useState<string[]>([]);
    const [bulkStock, setBulkStock] = useState('10');
    const [bulkLoading, setBulkLoading] = useState(false);

    const { toast } = useToast();

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inventory');
            const data = await res.json();
            if (data.success) {
                setItems(data.items);
                setLowStock(data.low_stock || []);
                setOutOfStock(data.out_of_stock || []);
                setLastUpdated(data.last_updated);
                // Initialize editing state
                const stockState: { [key: string]: number } = {};
                data.items.forEach((i: InventoryItem) => {
                    stockState[i.key] = i.stock;
                });
                setEditingStock(stockState);
            }
        } catch (err) {
            console.error("Failed to fetch inventory:", err);
            toast({ title: "Greška", description: "Neuspješno učitavanje inventara.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await getProducts(1, 100);
            setProducts(data);
        } catch (err) {
            console.error("Failed to fetch products:", err);
        }
    };

    useEffect(() => {
        fetchInventory();
        fetchProducts();
    }, []);

    // Sync from WooCommerce
    const syncFromWC = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/inventory/sync', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                toast({
                    title: "Sync završen!",
                    description: data.message,
                });
                fetchInventory();
            } else {
                toast({ title: "Greška", description: data.error || "Sync neuspješan.", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Greška", description: "Sync neuspješan.", variant: "destructive" });
        } finally {
            setSyncing(false);
        }
    };

    // Update single item stock
    const updateStock = async (key: string, stock: number) => {
        setSaving(key);
        try {
            const res = await fetch(`/api/inventory/${encodeURIComponent(key)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock }),
            });
            const data = await res.json();
            if (data.success) {
                setItems(prev => prev.map(i => i.key === key ? { ...i, stock, auto_created: false } : i));
                toast({ title: "Spremljeno", description: `Zaliha ažurirana: ${stock}` });
            }
        } catch (err) {
            toast({ title: "Greška", description: "Neuspješno ažuriranje.", variant: "destructive" });
        } finally {
            setSaving(null);
        }
    };

    // Add single item
    const addItem = async () => {
        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem),
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Dodano", description: `${newItem.name} dodan u inventar.` });
                setNewItem({ product_id: '', name: '', size: '', color: '', stock: '0', note: '' });
                setAddDialogOpen(false);
                fetchInventory();
            }
        } catch (err) {
            toast({ title: "Greška", description: "Neuspješno dodavanje.", variant: "destructive" });
        }
    };

    // Bulk add items (all size × color combinations for a product)
    const bulkAddItems = async () => {
        if (!selectedProduct || bulkSizes.length === 0 || bulkColors.length === 0) {
            toast({ title: "Greška", description: "Odaberite proizvod, veličine i boje.", variant: "destructive" });
            return;
        }

        setBulkLoading(true);
        try {
            const promises = [];
            for (const size of bulkSizes) {
                for (const color of bulkColors) {
                    promises.push(
                        fetch('/api/inventory', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                product_id: selectedProduct.id,
                                name: selectedProduct.name,
                                size,
                                color,
                                stock: parseInt(bulkStock) || 0,
                            }),
                        })
                    );
                }
            }

            await Promise.all(promises);
            const count = bulkSizes.length * bulkColors.length;
            toast({
                title: "Bulk dodano!",
                description: `${count} varijanti dodano za ${selectedProduct.name}.`
            });
            setBulkMode(false);
            setSelectedProduct(null);
            setBulkSizes([]);
            setBulkColors([]);
            fetchInventory();
        } catch (err) {
            toast({ title: "Greška", description: "Bulk dodavanje neuspješno.", variant: "destructive" });
        } finally {
            setBulkLoading(false);
        }
    };

    // Delete item
    const deleteItem = async (key: string) => {
        if (!confirm("Sigurno želite ukloniti ovu stavku iz inventara?")) return;
        try {
            await fetch(`/api/inventory/${encodeURIComponent(key)}`, { method: 'DELETE' });
            setItems(prev => prev.filter(i => i.key !== key));
            toast({ title: "Uklonjeno", description: "Stavka uklonjena iz inventara." });
        } catch (err) {
            toast({ title: "Greška", description: "Neuspješno brisanje.", variant: "destructive" });
        }
    };

    // Filter items
    const filteredItems = items.filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.name?.toLowerCase().includes(q) ||
            item.size?.toLowerCase().includes(q) ||
            item.color?.toLowerCase().includes(q)
        );
    });

    // Group by product name
    const groupedItems: Record<string, InventoryItem[]> = {};
    filteredItems.forEach(item => {
        const groupKey = item.name || 'Nepoznato';
        if (!groupedItems[groupKey]) groupedItems[groupKey] = [];
        groupedItems[groupKey].push(item);
    });

    const totalStock = items.reduce((sum, i) => sum + i.stock, 0);
    const totalSold = items.reduce((sum, i) => sum + (i.total_sold || 0), 0);

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-8">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                        INVENTAR
                    </h1>
                    <p className="text-slate-500 text-sm md:text-lg font-medium mt-1">
                        Upravljajte zalihama proizvoda.
                        {lastUpdated && (
                            <span className="text-slate-400 ml-2 text-xs">
                                Zadnje ažurirano: {new Date(lastUpdated).toLocaleString('hr-HR')}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        className="rounded-full font-bold text-xs uppercase tracking-wider h-10"
                        onClick={syncFromWC}
                        disabled={syncing}
                    >
                        {syncing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CloudDownload className="w-3 h-3 mr-1" />}
                        Sync iz WC
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-full font-bold text-xs uppercase tracking-wider h-10"
                        onClick={fetchInventory}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                        Osvježi
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-none shadow-lg bg-white rounded-[1.5rem] p-5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Box className="w-3 h-3" /> Stavki
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-1">{items.length}</div>
                </Card>
                <Card className="border-none shadow-lg bg-emerald-50 rounded-[1.5rem] p-5 border border-emerald-100">
                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                        <Package className="w-3 h-3" /> Ukupno na stanju
                    </div>
                    <div className="text-2xl font-black text-emerald-700 mt-1">{totalStock}</div>
                </Card>
                <Card className="border-none shadow-lg bg-amber-50 rounded-[1.5rem] p-5 border border-amber-100">
                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Niske zalihe
                    </div>
                    <div className="text-2xl font-black text-amber-700 mt-1">{lowStock.length}</div>
                </Card>
                <Card className="border-none shadow-lg bg-blue-50 rounded-[1.5rem] p-5 border border-blue-100">
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Ukupno prodano
                    </div>
                    <div className="text-2xl font-black text-blue-700 mt-1">{totalSold}</div>
                </Card>
            </div>

            {/* Low stock alerts */}
            {lowStock.length > 0 && (
                <Card className="border-amber-200 bg-amber-50 rounded-[1.5rem] p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-amber-700">Upozorenje: Niske zalihe</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {lowStock.map(item => (
                            <Badge key={item.key} variant="outline" className="border-amber-300 text-amber-800 bg-amber-100 font-bold text-xs py-1 px-3 rounded-full">
                                {item.name} {item.size && `/ ${item.size}`} {item.color && (
                                    <>
                                        <span className="inline-block w-3 h-3 rounded-full border ml-1" style={{ backgroundColor: getColorHex(item.color) }} />
                                        <span className="ml-1">{item.color}</span>
                                    </>
                                )} — <span className="text-amber-900 font-black">{item.stock}</span>
                            </Badge>
                        ))}
                    </div>
                </Card>
            )}

            {/* Search + Actions */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Traži po nazivu, veličini ili boji..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-full h-12 border-2 border-slate-100 bg-white focus:border-primary transition-all text-sm font-medium"
                    />
                </div>
                <div className="flex gap-2">
                    {/* Single Add */}
                    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-full font-bold text-xs uppercase tracking-wider h-12 px-5 shadow-lg">
                                <Plus className="w-4 h-4 mr-1" /> Dodaj Stavku
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase tracking-tight">Nova Stavka Inventara</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">Proizvod</Label>
                                    <select
                                        className="w-full h-12 rounded-xl border-2 border-slate-100 px-4 font-medium bg-white"
                                        value={newItem.product_id}
                                        onChange={(e) => {
                                            const product = products.find(p => p.id === parseInt(e.target.value));
                                            setNewItem(prev => ({
                                                ...prev,
                                                product_id: e.target.value,
                                                name: product?.name || prev.name,
                                            }));
                                        }}
                                    >
                                        <option value="">Odaberite proizvod...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase">Veličina</Label>
                                        <select
                                            className="w-full h-12 rounded-xl border-2 border-slate-100 px-4 font-medium bg-white"
                                            value={newItem.size}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, size: e.target.value }))}
                                        >
                                            <option value="">—</option>
                                            {ALL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase">Boja</Label>
                                        <select
                                            className="w-full h-12 rounded-xl border-2 border-slate-100 px-4 font-medium bg-white"
                                            value={newItem.color}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                                        >
                                            <option value="">—</option>
                                            {ALL_COLORS.map(name => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">Početna zaliha</Label>
                                    <Input
                                        type="number"
                                        value={newItem.stock}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, stock: e.target.value }))}
                                        className="h-12 rounded-xl border-2 font-bold text-center text-lg"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" className="rounded-full">Odustani</Button>
                                </DialogClose>
                                <Button onClick={addItem} disabled={!newItem.product_id} className="rounded-full font-bold">
                                    <Plus className="w-4 h-4 mr-1" /> Dodaj
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Bulk Add */}
                    <Dialog open={bulkMode} onOpenChange={setBulkMode}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="rounded-full font-bold text-xs uppercase tracking-wider h-12 px-5">
                                <Box className="w-4 h-4 mr-1" /> Bulk Dodaj
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase tracking-tight">Bulk Dodaj Inventar</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-5 py-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">Proizvod</Label>
                                    <select
                                        className="w-full h-12 rounded-xl border-2 border-slate-100 px-4 font-medium bg-white"
                                        value={selectedProduct?.id || ''}
                                        onChange={(e) => setSelectedProduct(products.find(p => p.id === parseInt(e.target.value)) || null)}
                                    >
                                        <option value="">Odaberite proizvod...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">Veličine</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {ALL_SIZES.map(size => (
                                            <Button
                                                key={size}
                                                variant={bulkSizes.includes(size) ? "default" : "outline"}
                                                size="sm"
                                                className="rounded-full font-bold text-xs"
                                                onClick={() => setBulkSizes(prev =>
                                                    prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                                                )}
                                            >
                                                {size}
                                            </Button>
                                        ))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full text-xs text-primary font-bold"
                                            onClick={() => setBulkSizes(bulkSizes.length === ALL_SIZES.length ? [] : [...ALL_SIZES])}
                                        >
                                            {bulkSizes.length === ALL_SIZES.length ? 'Ništa' : 'Sve'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">Boje</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {ALL_COLORS.map(name => (
                                            <Button
                                                key={name}
                                                variant={bulkColors.includes(name) ? "default" : "outline"}
                                                size="sm"
                                                className="rounded-full font-bold text-xs gap-1.5"
                                                onClick={() => setBulkColors(prev =>
                                                    prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
                                                )}
                                            >
                                                <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: getColorHex(name) }} />
                                                {name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">Zaliha po varijanti</Label>
                                    <Input
                                        type="number"
                                        value={bulkStock}
                                        onChange={(e) => setBulkStock(e.target.value)}
                                        className="h-12 rounded-xl border-2 font-bold text-center text-lg"
                                    />
                                </div>

                                {selectedProduct && bulkSizes.length > 0 && bulkColors.length > 0 && (
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <p className="text-xs font-bold text-slate-500">
                                            Kreirati će se <span className="text-primary font-black">{bulkSizes.length * bulkColors.length}</span> varijanti
                                            za <span className="text-slate-900 font-black">{selectedProduct.name}</span>,
                                            svaka sa <span className="text-primary font-black">{bulkStock}</span> komada na stanju.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" className="rounded-full">Odustani</Button>
                                </DialogClose>
                                <Button
                                    onClick={bulkAddItems}
                                    disabled={bulkLoading || !selectedProduct || bulkSizes.length === 0 || bulkColors.length === 0}
                                    className="rounded-full font-bold"
                                >
                                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                                    Kreiraj {bulkSizes.length * bulkColors.length} varijanti
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Inventory List */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 animate-spin text-primary" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Učitavanje inventara...</p>
                </div>
            ) : Object.keys(groupedItems).length === 0 ? (
                <Card className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 border-none shadow-lg">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                        <Package className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">INVENTAR JE PRAZAN</h3>
                    <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
                        Kliknite "Sync iz WC" za uvoz iz WooCommerce-a ili koristite "Dodaj Stavku" za ručno dodavanje.
                    </p>
                </Card>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedItems).map(([productName, productItems]) => (
                        <Card key={productName} className="overflow-hidden border-none shadow-lg shadow-slate-200/30 bg-white rounded-[2rem]">
                            {/* Product Header */}
                            <div className="p-6 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{productName}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {productItems.length} varijanti · ID: {productItems[0]?.product_id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-slate-900">
                                            {productItems.reduce((sum, i) => sum + i.stock, 0)}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">ukupno na stanju</div>
                                    </div>
                                </div>
                            </div>

                            {/* Variant Rows */}
                            <div className="divide-y divide-slate-50">
                                {productItems.map(item => {
                                    const colorHex = getColorHex(item.color);
                                    const isSaving = saving === item.key;
                                    const currentStock = editingStock[item.key] ?? item.stock;
                                    const hasChanged = currentStock !== item.stock;
                                    const isLow = item.stock > 0 && item.stock <= 3;
                                    const isOut = item.stock === 0 && !item.auto_created;

                                    return (
                                        <div
                                            key={item.key}
                                            className={cn(
                                                "flex items-center gap-3 md:gap-6 px-5 md:px-6 py-4 transition-all hover:bg-slate-50/50",
                                                isOut && "bg-red-50/30",
                                                isLow && "bg-amber-50/30",
                                                item.auto_created && "opacity-60"
                                            )}
                                        >
                                            {/* Color swatch */}
                                            <div
                                                className={cn(
                                                    "w-8 h-8 rounded-full shrink-0 shadow-inner",
                                                    item.color === 'Bijela' ? "border-2 border-slate-300" : "border-2 border-slate-200"
                                                )}
                                                style={{ backgroundColor: colorHex }}
                                                title={item.color}
                                            />

                                            {/* Variant info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {item.size && (
                                                        <Badge variant="secondary" className="text-[9px] font-black uppercase rounded-full px-2 py-0.5">
                                                            {item.size}
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs font-bold text-slate-600">{item.color || '—'}</span>
                                                    {item.auto_created && (
                                                        <Badge variant="outline" className="text-[8px] font-bold text-amber-600 border-amber-200 rounded-full">
                                                            Auto
                                                        </Badge>
                                                    )}
                                                    {item.synced_from_wc && (
                                                        <Badge variant="outline" className="text-[8px] font-bold text-blue-600 border-blue-200 rounded-full">
                                                            WC
                                                        </Badge>
                                                    )}
                                                    {isLow && (
                                                        <Badge variant="outline" className="text-[8px] font-bold text-amber-600 border-amber-200 bg-amber-50 rounded-full">
                                                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Niske zalihe
                                                        </Badge>
                                                    )}
                                                    {isOut && (
                                                        <Badge variant="outline" className="text-[8px] font-bold text-red-600 border-red-200 bg-red-50 rounded-full">
                                                            Rasprodano
                                                        </Badge>
                                                    )}
                                                </div>
                                                {item.total_sold > 0 && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        Prodano: {item.total_sold}
                                                        {item.last_sold && ` · ${new Date(item.last_sold).toLocaleDateString('hr-HR')}`}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Stock input */}
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={currentStock}
                                                    onChange={(e) => setEditingStock(prev => ({
                                                        ...prev,
                                                        [item.key]: parseInt(e.target.value) || 0,
                                                    }))}
                                                    className={cn(
                                                        "w-20 h-10 rounded-full text-center font-bold border-2 transition-all",
                                                        hasChanged ? "border-primary bg-primary/5" : "border-slate-100 bg-slate-50"
                                                    )}
                                                />
                                                {hasChanged && (
                                                    <Button
                                                        size="icon"
                                                        className="h-10 w-10 rounded-full shadow-md"
                                                        disabled={isSaving}
                                                        onClick={() => updateStock(item.key, currentStock)}
                                                    >
                                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => deleteItem(item.key)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Inventory;
