import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, RefreshCcw, Palette, Layers, Ban, Wand2, Clock, X, Plus, Image as ImageIcon, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const WP_API_URL = '/api'; // Uses proxy in dev and prod

// Import designs from local assets (same as Shop.tsx)
// @ts-ignore
const streetDesigns = import.meta.glob('/src/assets/design-collections/street/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' });
// @ts-ignore
const vintageDesigns = import.meta.glob('/src/assets/design-collections/vintage/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' });
// @ts-ignore
const logoDesigns = import.meta.glob('/src/assets/design-collections/logo/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' });

// Process designs to get filename and URL
const processDesignGlob = (globResult: Record<string, unknown>) => {
    return Object.entries(globResult).map(([path, url]) => ({
        path,
        url: url as string,
        filename: path.split('/').pop() || ''
    }));
};

const DESIGN_COLLECTIONS = {
    'Street': processDesignGlob(streetDesigns),
    'Vintage': processDesignGlob(vintageDesigns),
    'Logo': processDesignGlob(logoDesigns)
};

// Shared color definitions
const ALL_COLORS = [
    { name: 'Crna', hex: '#231f20' },
    { name: 'Siva', hex: '#d1d5db' },
    { name: 'Tirkizna', hex: '#00ab98' },
    { name: 'Cijan', hex: '#00aeef' },
    { name: 'Plava', hex: '#387bbf' },
    { name: 'Ljubičasta', hex: '#8358a4' },
    { name: 'Bijela', hex: '#ffffff' },
    { name: 'Roza', hex: '#e78fab' },
    { name: 'Mint', hex: '#a1d7c0' }
];

const PRODUCT_LABELS: Record<string, string> = {
    tshirt: 'T-Shirt',
    hoodie: 'Hoodie',
    cap: 'Cap',
    bottle: 'Bottle'
};

interface ProductConfig {
    allowed_colors: string[];
    default_zone: 'front' | 'back';
    locked_zone: 'front' | 'back' | null;
    restricted_designs: string[];
    has_front_back: boolean;
    cycle_enabled?: boolean;
    cycle_duration?: number;
    cycle_colors?: string[];
}

interface AlternativeRule {
    design_id: string;
    trigger_colors: string[];
    replace_with: string;
}

interface ShopConfig {
    tshirt: ProductConfig;
    hoodie: ProductConfig;
    cap: ProductConfig;
    bottle: ProductConfig;
    alternatives: AlternativeRule[];
    design_color_map: Record<string, string[]>;
}

const ShopRules = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<ShopConfig | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<'tshirt' | 'hoodie' | 'cap' | 'bottle'>('tshirt');
    const [selectedCollection, setSelectedCollection] = useState<'Street' | 'Vintage' | 'Logo'>('Street');
    const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
    const [previewColor, setPreviewColor] = useState<string>('#231f20');
    const { toast } = useToast();
    const { token } = useAuth();

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${WP_API_URL}/antigravity/v1/shop-config`);
            if (!res.ok) throw new Error('Failed to fetch config');
            const data = await res.json();
            console.log('[ShopRules] Fetched config:', data);
            console.log('[ShopRules] T-shirt allowed_colors from server:', data.tshirt?.allowed_colors);
            setConfig(data);
        } catch (error) {
            console.error('Failed to fetch shop config:', error);
            toast({ title: 'Error', description: 'Failed to load configuration', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async () => {
        if (!config) return;
        setSaving(true);
        try {
            console.log('[ShopRules] Saving config, token:', token ? `${token.substring(0, 20)}...` : 'NULL');
            console.log('[ShopRules] Config being sent:', JSON.stringify(config, null, 2));
            console.log('[ShopRules] T-shirt allowed_colors:', config.tshirt?.allowed_colors);
            console.log('[ShopRules] T-shirt restricted_designs:', config.tshirt?.restricted_designs);
            if (!token) throw new Error('You must be logged in to save changes.');

            const res = await fetch(`${WP_API_URL}/antigravity/v1/shop-config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${token}`
                },
                body: JSON.stringify(config)
            });
            console.log('[ShopRules] Save response status:', res.status);
            const responseData = await res.json();
            console.log('[ShopRules] Server response:', responseData);
            if (!res.ok) {
                throw new Error(responseData.message || 'Failed to save');
            }
            toast({ title: 'Saved!', description: 'Shop configuration updated successfully.' });
        } catch (error: any) {
            console.error('Failed to save shop config:', error);
            toast({ title: 'Error', description: error.message || 'Failed to save configuration', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // Toggle product allowed color
    const toggleProductColor = (colorHex: string) => {
        if (!config) return;
        const productConfig = config[selectedProduct];
        const isAllowed = productConfig.allowed_colors.includes(colorHex);
        setConfig({
            ...config,
            [selectedProduct]: {
                ...productConfig,
                allowed_colors: isAllowed
                    ? productConfig.allowed_colors.filter(c => c !== colorHex)
                    : [...productConfig.allowed_colors, colorHex]
            }
        });
    };

    // Toggle design color in design_color_map
    const toggleDesignColor = (designFilename: string, colorHex: string) => {
        if (!config) return;
        const currentColors = config.design_color_map[designFilename] || ALL_COLORS.map(c => c.hex);
        const hasColor = currentColors.includes(colorHex);
        setConfig({
            ...config,
            design_color_map: {
                ...config.design_color_map,
                [designFilename]: hasColor
                    ? currentColors.filter(c => c !== colorHex)
                    : [...currentColors, colorHex]
            }
        });
    };

    // Toggle design restriction for current product
    const toggleDesignRestriction = (designFilename: string) => {
        if (!config) return;
        const productConfig = config[selectedProduct];
        const isRestricted = productConfig.restricted_designs.includes(designFilename);
        setConfig({
            ...config,
            [selectedProduct]: {
                ...productConfig,
                restricted_designs: isRestricted
                    ? productConfig.restricted_designs.filter(d => d !== designFilename)
                    : [...productConfig.restricted_designs, designFilename]
            }
        });
    };

    // Update cycle settings
    const updateCycleSetting = (key: keyof ProductConfig, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            [selectedProduct]: {
                ...config[selectedProduct],
                [key]: value
            }
        });
    };

    // Add new alternative rule
    const addAlternative = () => {
        if (!config || !selectedDesign) return;
        const existing = config.alternatives.find(a => a.design_id === selectedDesign);
        if (existing) {
            toast({ title: 'Already exists', description: 'This design already has an alternative rule.' });
            return;
        }
        setConfig({
            ...config,
            alternatives: [
                ...config.alternatives,
                { design_id: selectedDesign, trigger_colors: [], replace_with: '' }
            ]
        });
    };

    // Update alternative rule
    const updateAlternative = (designId: string, field: keyof AlternativeRule, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            alternatives: config.alternatives.map(alt =>
                alt.design_id === designId ? { ...alt, [field]: value } : alt
            )
        });
    };

    // Toggle trigger color for alternative
    const toggleAlternativeTriggerColor = (designId: string, colorHex: string) => {
        if (!config) return;
        const alt = config.alternatives.find(a => a.design_id === designId);
        if (!alt) return;
        const hasColor = alt.trigger_colors.includes(colorHex);
        updateAlternative(designId, 'trigger_colors', hasColor
            ? alt.trigger_colors.filter(c => c !== colorHex)
            : [...alt.trigger_colors, colorHex]
        );
    };

    // Remove alternative
    const removeAlternative = (designId: string) => {
        if (!config) return;
        setConfig({
            ...config,
            alternatives: config.alternatives.filter(a => a.design_id !== designId)
        });
    };

    // Get designs for current collection
    const currentDesigns = useMemo(() => DESIGN_COLLECTIONS[selectedCollection], [selectedCollection]);

    // Get design colors from config
    const getDesignColors = (filename: string) => {
        if (!config) return ALL_COLORS.map(c => c.hex);
        return config.design_color_map[filename] || ALL_COLORS.map(c => c.hex);
    };

    // Check if design is restricted for current product
    const isDesignRestricted = (filename: string) => {
        if (!config) return false;
        return config[selectedProduct].restricted_designs.includes(filename);
    };

    // Get alternative for design
    const getAlternative = (filename: string) => {
        if (!config) return null;
        return config.alternatives.find(a => a.design_id === filename) || null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!config) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-slate-500">Failed to load configuration.</p>
                <Button onClick={fetchConfig}>Retry</Button>
            </div>
        );
    }

    const productConfig = config[selectedProduct];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
                <div>
                    <h2 className="text-2xl md:text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                        Shop Rules
                    </h2>
                    <p className="text-slate-500 text-sm md:text-lg font-medium mt-1">
                        Configure colors, designs, and cycle logic per product.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchConfig} disabled={loading}>
                        <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                    <Button onClick={saveConfig} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Product Selector */}
            <div className="flex flex-wrap gap-2">
                {(['tshirt', 'hoodie', 'cap', 'bottle'] as const).map(p => (
                    <Button
                        key={p}
                        variant={selectedProduct === p ? 'default' : 'outline'}
                        onClick={() => setSelectedProduct(p)}
                        className="font-bold"
                    >
                        {PRODUCT_LABELS[p]}
                    </Button>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: Product Settings */}
                <Card className="rounded-2xl border-slate-100 shadow-lg lg:col-span-1">
                    <CardHeader className="pb-4 border-b border-slate-100">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Layers className="w-5 h-5 text-blue-500" />
                            {PRODUCT_LABELS[selectedProduct]} Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-5">
                        {/* Allowed Colors */}
                        <div>
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                                <Palette className="w-4 h-4" /> Product Colors
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {ALL_COLORS.map(color => {
                                    const isAllowed = productConfig.allowed_colors.includes(color.hex);
                                    return (
                                        <button
                                            key={color.hex}
                                            onClick={() => toggleProductColor(color.hex)}
                                            className={`w-7 h-7 rounded-full border-2 transition-all ${isAllowed ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-300 opacity-40'}`}
                                            style={{ backgroundColor: color.hex }}
                                            title={color.name}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Zone Settings */}
                        {productConfig.has_front_back && (
                            <>
                                <div>
                                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Default Zone</Label>
                                    <div className="flex gap-2">
                                        <Button variant={productConfig.default_zone === 'front' ? 'default' : 'outline'} size="sm" onClick={() => updateCycleSetting('default_zone', 'front')}>Front</Button>
                                        <Button variant={productConfig.default_zone === 'back' ? 'default' : 'outline'} size="sm" onClick={() => updateCycleSetting('default_zone', 'back')}>Back</Button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Locked Zone</Label>
                                    <div className="flex gap-2">
                                        <Button variant={productConfig.locked_zone === 'front' ? 'default' : 'outline'} size="sm" onClick={() => updateCycleSetting('locked_zone', 'front')}>Front</Button>
                                        <Button variant={productConfig.locked_zone === 'back' ? 'default' : 'outline'} size="sm" onClick={() => updateCycleSetting('locked_zone', 'back')}>Back</Button>
                                        <Button variant={productConfig.locked_zone === null ? 'default' : 'outline'} size="sm" onClick={() => updateCycleSetting('locked_zone', null)}>None</Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Cycle Logic */}
                        <div className="pt-3 border-t border-slate-100">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4" /> Cycle Logic
                            </Label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Enable Cycle</span>
                                    <Switch
                                        checked={productConfig.cycle_enabled ?? true}
                                        onCheckedChange={(v) => updateCycleSetting('cycle_enabled', v)}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Duration (ms)</Label>
                                    <Input
                                        type="number"
                                        value={productConfig.cycle_duration ?? 6000}
                                        onChange={(e) => updateCycleSetting('cycle_duration', parseInt(e.target.value) || 6000)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Restricted Designs Summary */}
                        <div className="pt-3 border-t border-slate-100">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                                <Ban className="w-4 h-4" /> Restricted ({productConfig.restricted_designs.length})
                            </Label>
                            <p className="text-xs text-slate-400">
                                {productConfig.restricted_designs.length > 0
                                    ? productConfig.restricted_designs.join(', ')
                                    : 'None - manage in Collections →'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Collections Manager */}
                <Card className="rounded-2xl border-slate-100 shadow-lg lg:col-span-2">
                    <CardHeader className="pb-4 border-b border-slate-100">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-purple-500" />
                            Collections Manager
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {/* Collection Tabs */}
                        <Tabs value={selectedCollection} onValueChange={(v) => setSelectedCollection(v as any)}>
                            <TabsList className="mb-4">
                                <TabsTrigger value="Street">Street</TabsTrigger>
                                <TabsTrigger value="Vintage">Vintage</TabsTrigger>
                                <TabsTrigger value="Logo">Logo</TabsTrigger>
                            </TabsList>

                            {(['Street', 'Vintage', 'Logo'] as const).map(collection => (
                                <TabsContent key={collection} value={collection} className="space-y-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {DESIGN_COLLECTIONS[collection].map(design => {
                                            const isRestricted = isDesignRestricted(design.filename);
                                            const alt = getAlternative(design.filename);
                                            const isSelected = selectedDesign === design.filename;

                                            return (
                                                <div
                                                    key={design.filename}
                                                    onClick={() => setSelectedDesign(isSelected ? null : design.filename)}
                                                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' :
                                                        isRestricted ? 'border-red-300 opacity-60' : 'border-slate-200 hover:border-slate-400'
                                                        }`}
                                                >
                                                    {/* Preview with background color */}
                                                    <div className="aspect-square flex items-center justify-center p-2" style={{ backgroundColor: previewColor }}>
                                                        <img src={design.url} alt={design.filename} className="max-w-full max-h-full object-contain" />
                                                    </div>

                                                    {/* Labels */}
                                                    <div className="absolute top-1 right-1 flex gap-1">
                                                        {isRestricted && (
                                                            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                                                BLOCKED
                                                            </span>
                                                        )}
                                                        {alt && (
                                                            <span className="bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                                                ALT
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Filename */}
                                                    <div className="bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-mono text-slate-600 truncate">
                                                        {design.filename}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>

                        {/* Preview Color Selector */}
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                            <Label className="text-sm font-semibold text-slate-700">Preview Color:</Label>
                            <div className="flex gap-1">
                                {ALL_COLORS.map(c => (
                                    <button
                                        key={c.hex}
                                        onClick={() => setPreviewColor(c.hex)}
                                        className={`w-6 h-6 rounded-full border transition-all ${previewColor === c.hex ? 'ring-2 ring-blue-400 border-blue-500' : 'border-slate-300'}`}
                                        style={{ backgroundColor: c.hex }}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Design Detail Panel (when selected) */}
            {selectedDesign && (
                <Card className="rounded-2xl border-blue-200 shadow-lg bg-blue-50/30">
                    <CardHeader className="pb-4 border-b border-blue-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Palette className="w-5 h-5 text-blue-500" />
                            {selectedDesign}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedDesign(null)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Left: Preview */}
                            <div>
                                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Live Preview</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ALL_COLORS.filter(c => productConfig.allowed_colors.includes(c.hex)).map(c => {
                                        const designColors = getDesignColors(selectedDesign);
                                        const isAllowed = designColors.includes(c.hex);
                                        const designUrl = currentDesigns.find(d => d.filename === selectedDesign)?.url;
                                        return (
                                            <div
                                                key={c.hex}
                                                onClick={() => toggleDesignColor(selectedDesign, c.hex)}
                                                className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${isAllowed ? 'border-green-500 ring-1 ring-green-300' : 'border-red-300 opacity-50'
                                                    }`}
                                                style={{ backgroundColor: c.hex }}
                                                title={`Click to ${isAllowed ? 'disable' : 'enable'} ${c.name}`}
                                            >
                                                <div className="w-full h-full flex items-center justify-center p-2 relative">
                                                    {designUrl && <img src={designUrl} alt="" className="max-w-full max-h-full object-contain" />}
                                                    <div className="absolute top-1 right-1">
                                                        {isAllowed ? (
                                                            <Check className="w-4 h-4 text-green-600 bg-white rounded-full p-0.5" />
                                                        ) : (
                                                            <X className="w-4 h-4 text-red-600 bg-white rounded-full p-0.5" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right: Settings */}
                            <div className="space-y-4">
                                {/* Restriction Toggle */}
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                                    <div>
                                        <Label className="font-semibold text-slate-700">Restrict for {PRODUCT_LABELS[selectedProduct]}</Label>
                                        <p className="text-xs text-slate-500">Hide this design from this product</p>
                                    </div>
                                    <Switch
                                        checked={isDesignRestricted(selectedDesign)}
                                        onCheckedChange={() => toggleDesignRestriction(selectedDesign)}
                                    />
                                </div>

                                {/* Alternative Design */}
                                <div className="p-3 bg-white rounded-lg border border-slate-200">
                                    <Label className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                                        <Wand2 className="w-4 h-4 text-purple-500" /> Alternative Design
                                    </Label>
                                    {(() => {
                                        const alt = getAlternative(selectedDesign);
                                        if (!alt) {
                                            return (
                                                <Button variant="outline" size="sm" onClick={addAlternative}>
                                                    <Plus className="w-4 h-4 mr-1" /> Add Alternative Rule
                                                </Button>
                                            );
                                        }
                                        return (
                                            <div className="space-y-3">
                                                <div>
                                                    <Label className="text-xs text-slate-500">Trigger Colors (click to toggle)</Label>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {ALL_COLORS.map(c => {
                                                            const isActive = alt.trigger_colors.includes(c.hex);
                                                            return (
                                                                <button
                                                                    key={c.hex}
                                                                    onClick={() => toggleAlternativeTriggerColor(selectedDesign, c.hex)}
                                                                    className={`w-6 h-6 rounded-full border-2 transition-all ${isActive ? 'border-purple-500 ring-2 ring-purple-200' : 'border-slate-300 opacity-50'}`}
                                                                    style={{ backgroundColor: c.hex }}
                                                                    title={c.name}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-slate-500">Replace With (filename)</Label>
                                                    <Input
                                                        value={alt.replace_with}
                                                        onChange={(e) => updateAlternative(selectedDesign, 'replace_with', e.target.value)}
                                                        placeholder="e.g. street-3-alt.png"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <Button variant="destructive" size="sm" onClick={() => removeAlternative(selectedDesign)}>
                                                    <X className="w-4 h-4 mr-1" /> Remove Rule
                                                </Button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ShopRules;
