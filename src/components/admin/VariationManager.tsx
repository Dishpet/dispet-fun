import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { getProductVariations, updateProductVariation } from "@/integrations/wordpress/woocommerce";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";

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

interface VariationManagerProps {
    productId: number;
}

export const VariationManager = ({ productId }: VariationManagerProps) => {
    const [variations, setVariations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    // Local edits state: { [variationId]: { price: string, stock_quantity: number, ... } }
    const [edits, setEdits] = useState<{ [key: number]: any }>({});

    const fetchVariations = async () => {
        setLoading(true);
        try {
            const data = await getProductVariations(productId);
            setVariations(data);
            // Initialize edits
            const initialEdits: any = {};
            data.forEach((v: any) => {
                initialEdits[v.id] = {
                    regular_price: v.regular_price,
                    stock_quantity: v.stock_quantity ?? 0,
                    manage_stock: v.manage_stock ?? true, // Force manage stock on by default if editing
                    sale_price: v.sale_price
                };
            });
            setEdits(initialEdits);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load variations", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) fetchVariations();
    }, [productId]);

    const handleEditChange = (id: number, field: string, value: any) => {
        setEdits(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSave = async (variationId: number) => {
        setSaving(true);
        try {
            const data = edits[variationId];
            await updateProductVariation(productId, variationId, data);
            toast({ title: "Success", description: "Variation updated" });
            fetchVariations(); // Refresh to ensure sync
        } catch (error) {
            toast({ title: "Error", description: "Failed to update variation", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const promises = variations.map(v => updateProductVariation(productId, v.id, edits[v.id]));
            await Promise.all(promises);
            toast({ title: "Success", description: "All variations updated" });
            fetchVariations();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update some variations", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Učitavanje varijacija...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Mobile-friendly header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Varijacije</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{variations.length} pronađenih varijacija</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchVariations}
                        className="flex-1 sm:flex-initial h-10 rounded-xl font-bold text-xs uppercase tracking-wider border-slate-200 hover:bg-white"
                    >
                        <RefreshCw className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Osvježi</span>
                    </Button>
                    <Button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="flex-1 sm:flex-initial h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2 stroke-[3]" />}
                        Spremi Sve
                    </Button>
                </div>
            </div>

            {/* Variations grid */}
            <div className="grid gap-4">
                {variations.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <ChevronDown className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2">Nema Varijacija</h4>
                        <p className="text-slate-500 max-w-sm font-medium">
                            Prvo dodajte atribute u WooCommerce-u kako biste mogli upravljati varijacijama.
                        </p>
                    </div>
                )}
                {variations.map(variation => (
                    <VariationCard
                        key={variation.id}
                        variation={variation}
                        editData={edits[variation.id]}
                        onChange={(field, val) => handleEditChange(variation.id, field, val)}
                        onSave={() => handleSave(variation.id)}
                        saving={saving}
                    />
                ))}
            </div>
        </div>
    );
};

const VariationCard = ({ variation, editData, onChange, onSave, saving }: any) => {
    const [isOpen, setIsOpen] = useState(false);

    // Extract color
    const colorAttr = variation.attributes?.find((a: any) => COLOR_MAP[a.option]);
    const colorHex = colorAttr ? COLOR_MAP[colorAttr.option] : null;
    const attributes = variation.attributes.map((a: any) => `${a.option}`).join(' / ');

    if (!editData) return null;

    return (
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                {/* Main row - mobile optimized */}
                <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4">
                        {/* Top row: variation info + toggle */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl shrink-0 hover:bg-slate-100">
                                        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
                                    </Button>
                                </CollapsibleTrigger>
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {colorHex && (
                                            <div
                                                className="w-5 h-5 rounded-full border-2 border-slate-200 shadow-inner shrink-0"
                                                style={{ backgroundColor: colorHex }}
                                            />
                                        )}
                                        <h4 className="font-black text-slate-900 text-base leading-tight truncate">
                                            {attributes || `Varijacija #${variation.id}`}
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant={variation.stock_status === 'instock' ? 'default' : 'destructive'}
                                            className="text-[10px] uppercase tracking-tighter font-black px-2 py-0.5 rounded-full"
                                        >
                                            {variation.stock_status === 'instock' ? 'Dostupno' : 'Rasprodano'}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {variation.id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick edit inputs - stacked on mobile, horizontal on desktop */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Zaliha</Label>
                                <Input
                                    type="number"
                                    className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold text-center"
                                    value={editData.stock_quantity ?? 0}
                                    onChange={(e) => onChange('stock_quantity', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cijena (€)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold text-center"
                                    value={editData.regular_price}
                                    onChange={(e) => onChange('regular_price', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-1 flex items-end">
                                <Button
                                    onClick={onSave}
                                    disabled={saving}
                                    className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-primary/30 transition-all"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2 stroke-[3]" />}
                                    Spremi
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expandable advanced options */}
                <CollapsibleContent>
                    <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Snižena Cijena (€)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="h-11 rounded-xl bg-white border-slate-200 font-bold"
                                    value={editData.sale_price || ''}
                                    onChange={(e) => onChange('sale_price', e.target.value)}
                                    placeholder="Unesite sniženu cijenu"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                                <div>
                                    <Label className="text-sm font-bold text-slate-700">Upravljaj Zalihom</Label>
                                    <p className="text-xs text-slate-500 mt-0.5">Omogući praćenje zaliha</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={editData.manage_stock}
                                    onChange={(e) => onChange('manage_stock', e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
};
