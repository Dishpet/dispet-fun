import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { wpFetch, getAuthHeaders } from "@/integrations/wordpress/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Data derived from Shop.tsx
const ATTRIBUTES = [
    {
        name: 'Veličina', // Size
        slug: 'pa_size',
        type: 'select',
        order_by: 'menu_order',
        has_archives: false,
        terms: ['6-8 g.', '8-10 g.', '10-12 g.', 'S', 'M', 'L', 'XL']
    },
    {
        name: 'Boja', // Color
        slug: 'pa_color',
        type: 'select',
        order_by: 'name',
        has_archives: false,
        terms: [
            'Crna', 'Siva', 'Tirkizna', 'Cijan',
            'Plava', 'Ljubičasta', 'Bijela', 'Roza', 'Mint'
        ]
    },
    {
        name: 'Dizajn', // Design
        slug: 'pa_design',
        type: 'select',
        order_by: 'name',
        has_archives: false,
        terms: [
            // Street
            'Street 1', 'Street 2', 'Street 3', 'Street 4', 'Street 5',
            'Street 6', 'Street 7', 'Street 8', 'Street 9', 'Street 10',
            // Vintage
            'Vintage 1', 'Vintage 2', 'Vintage 3', 'Vintage 4', 'Vintage 5',
            // Logo
            'Logo 1', 'Logo 2', 'Logo 3', 'Logo 4', 'Logo 5', 'Logo 6',
            'Logo 7', 'Logo 8', 'Logo 9', 'Logo 10', 'Logo 11', 'Logo 12',
            // Badges
            'Kids Badge', 'Street Badge', 'Vintage Badge'
        ]
    }
];

export const AttributeSync = () => {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const { toast } = useToast();

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const syncAttributes = async () => {
        setLoading(true);
        setLogs([]);
        addLog("Starting attribute synchronization...");

        try {
            const headers = getAuthHeaders();

            // 1. Get existing attributes
            addLog("Fetching existing attributes...");
            const existingAttrs = await wpFetch('/wc/v3/products/attributes', { headers });

            for (const attrDef of ATTRIBUTES) {
                let attrId;
                const existing = existingAttrs.find((a: any) => a.slug === attrDef.slug);

                if (existing) {
                    attrId = existing.id;
                    addLog(`Attribute '${attrDef.name}' already exists (ID: ${attrId}).`);
                } else {
                    addLog(`Creating attribute '${attrDef.name}'...`);
                    const newAttr = await wpFetch('/wc/v3/products/attributes', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            name: attrDef.name,
                            slug: attrDef.slug,
                            type: attrDef.type,
                            order_by: attrDef.order_by,
                            has_archives: attrDef.has_archives
                        })
                    });
                    attrId = newAttr.id;
                    addLog(`Created attribute '${attrDef.name}' (ID: ${attrId}).`);
                }

                // 2. Sync Terms
                if (attrId) {
                    addLog(`Syncing terms for '${attrDef.name}'...`);
                    // Fetch existing terms to avoid duplicates error
                    const existingTerms = await wpFetch(`/wc/v3/products/attributes/${attrId}/terms?per_page=100`, { headers });
                    const existingTermNames = existingTerms.map((t: any) => t.name);

                    for (const termName of attrDef.terms) {
                        if (!existingTermNames.includes(termName)) {
                            try {
                                await wpFetch(`/wc/v3/products/attributes/${attrId}/terms`, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify({ name: termName })
                                });
                                addLog(`  + Added term: ${termName}`);
                            } catch (e: any) {
                                addLog(`  ! Failed to add term ${termName}: ${e.message}`);
                            }
                        } else {
                            // addLog(`  = Term '${termName}' exists.`);
                        }
                    }
                }
            }

            addLog("Synchronization complete!");
            toast({ title: "Success", description: "Attributes synced successfully." });

        } catch (error: any) {
            console.error("Sync failed:", error);
            addLog(`Error: ${error.message}`);
            toast({ title: "Error", description: "Sync failed. Check console.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">WooCommerce Attributes Sync</CardTitle>
                <CardDescription>
                    Automatically create Attributes (Size, Color, Design) and their Terms in WooCommerce to match your site options.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={syncAttributes} disabled={loading} className="w-full sm:w-auto">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    {loading ? "Syncing..." : "Sync Attributes Now"}
                </Button>

                {logs.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md border text-xs font-mono max-h-60 overflow-y-auto space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-2">
                                <span className={log.includes('Error') || log.includes('Failed') ? 'text-red-500' : 'text-gray-600'}>
                                    {log}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
