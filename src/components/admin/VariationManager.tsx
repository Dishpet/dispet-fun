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

    // Extract color: Try to find an attribute whose option matches our color map
    const colorAttr = variation.attributes?.find((a: any) => COLOR_MAP[a.option]);
    const colorHex = colorAttr ? COLOR_MAP[colorAttr.option] : null;

    const attributes = variation.attributes.map((a: any) => `${a.option}`).join(' / ');

    // Safety check if editData is processing
    if (!editData) return null;

    return (
        <Card>
            <div className="p-4 flex items-center gap-4">
                <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </Button>
                            </CollapsibleTrigger>
                            <div>
                                <div className="flex items-center gap-3">
                                    {colorHex && (
                                        <div
                                            className="w-4 h-4 rounded-full border border-gray-300 shadow-sm shrink-0"
                                            style={{ backgroundColor: colorHex }}
                                            title={colorAttr.option}
                                        />
                                    )}
                                    <h4 className="font-medium text-sm text-gray-900">{attributes || `Variation #${variation.id}`}</h4>
                                </div>
                                <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                    <span>ID: {variation.id}</span>
                                    <Badge variant="outline" className="text-[10px] h-4">{variation.stock_status}</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <Label className="text-[10px] uppercase text-gray-500 mb-1">Stock</Label>
                                <Input
                                    type="number"
                                    className="w-20 h-8 text-right"
                                    value={editData.stock_quantity ?? 0}
                                    onChange={(e) => onChange('stock_quantity', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="flex flex-col items-end">
                                <Label className="text-[10px] uppercase text-gray-500 mb-1">Price (€)</Label>
                                <Input
                                    type="number"
                                    className="w-20 h-8 text-right"
                                    value={editData.regular_price}
                                    onChange={(e) => onChange('regular_price', e.target.value)}
                                />
                            </div>
                            <Button size="icon" variant="ghost" onClick={onSave} disabled={saving}>
                                <Save className="w-4 h-4 text-primary" />
                            </Button>
                        </div>
                    </div>

                    <CollapsibleContent className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Sale Price (€)</Label>
                            <Input
                                value={editData.sale_price || ''}
                                onChange={(e) => onChange('sale_price', e.target.value)}
                                placeholder="Sale Price"
                            />
                        </div>
                        <div className="flex items-center pt-8">
                            <span className="text-xs text-muted-foreground mr-2">Manage Stock?</span>
                            <input
                                type="checkbox"
                                checked={editData.manage_stock}
                                onChange={(e) => onChange('manage_stock', e.target.checked)}
                                className="toggle"
                            />
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </Card>
    );
};
