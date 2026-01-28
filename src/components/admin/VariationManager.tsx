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
import { cn } from "@/lib/utils";

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

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Variations ({variations.length})</h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchVariations} title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button onClick={handleSaveAll} disabled={saving} size="sm">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save All
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {variations.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                        No variations found. Add attributes in WooCommerce first.
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
        <Card className="overflow-hidden border-none shadow-md bg-white rounded-2xl transition-all">
            <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            {colorHex && (
                                <div
                                    className="w-5 h-5 rounded-full border border-slate-200 shadow-sm shrink-0"
                                    style={{ backgroundColor: colorHex }}
                                />
                            )}
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{attributes || `Variation #${variation.id}`}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {variation.id}</span>
                                    <Badge variant="outline" className="text-[9px] font-black h-4 px-1 leading-none uppercase tracking-tighter border-slate-200 text-slate-500">
                                        {variation.stock_status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Stock</Label>
                            <Input
                                type="number"
                                className="w-full sm:w-20 h-10 rounded-full bg-slate-50 border-none font-bold text-center sm:text-right focus:bg-white"
                                value={editData.stock_quantity ?? 0}
                                onChange={(e) => onChange('stock_quantity', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Price (€)</Label>
                            <Input
                                type="number"
                                className="w-full sm:w-20 h-10 rounded-full bg-slate-50 border-none font-bold text-center sm:text-right focus:bg-white"
                                value={editData.regular_price}
                                onChange={(e) => onChange('regular_price', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-primary font-bold text-xs uppercase tracking-wider hover:bg-primary/5 rounded-full px-4"
                    >
                        {isOpen ? "Skloni detalje" : "Više detalja"}
                    </Button>

                    <Button
                        size="sm"
                        onClick={onSave}
                        disabled={saving}
                        className="rounded-full font-bold text-xs uppercase tracking-wider px-4 min-w-[100px]"
                    >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-2" />}
                        Spremi
                    </Button>
                </div>

                <Collapsible open={isOpen}>
                    <CollapsibleContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Akcijska Cijena (€)</Label>
                                <Input
                                    className="h-10 rounded-full bg-slate-50 border-none font-bold focus:bg-white px-6"
                                    value={editData.sale_price || ''}
                                    onChange={(e) => onChange('sale_price', e.target.value)}
                                    placeholder="Npr. 19.99"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-6 sm:pt-4 ml-1">
                                <div
                                    className={cn(
                                        "w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out",
                                        editData.manage_stock ? "bg-primary" : "bg-slate-200"
                                    )}
                                    onClick={() => onChange('manage_stock', !editData.manage_stock)}
                                >
                                    <div className={cn(
                                        "w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm",
                                        editData.manage_stock ? "translate-x-4" : "translate-x-0"
                                    )} />
                                </div>
                                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Upravljaj zalihama</span>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </Card>
    );
};
