import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ExternalLink, Save, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPosts, createPost, updatePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { MediaPicker } from "@/components/admin/MediaPicker";

// Default imports
import caelor from "@/assets/partneri/caelor.png";
import digitalProdukt from "@/assets/partneri/digital-produkt.png";
import nkSpalato from "@/assets/partneri/nk-spalato.png";
import sunCitySport from "@/assets/partneri/sun-city-sport.png";

const DEFAULT_PARTNERS = [
    { id: "def-1", name: "Caelor", link: "", logoUrl: caelor },
    { id: "def-2", name: "Digital Produkt", link: "", logoUrl: digitalProdukt },
    { id: "def-3", name: "NK Spalato", link: "", logoUrl: nkSpalato },
    { id: "def-4", name: "Sun City Sport", link: "", logoUrl: sunCitySport },
];

const CONFIG_SLUG = "config-partners";

interface PartnerItem {
    id: string; // Unique ID for keying
    name: string;
    link: string;
    logoUrl: string;
}

export default function AdminPartners() {
    const [configPost, setConfigPost] = useState<WPPost | null>(null);
    const [partners, setPartners] = useState<PartnerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempName, setTempName] = useState("");
    const [tempLink, setTempLink] = useState("");
    const [tempLogoUrl, setTempLogoUrl] = useState("");

    const { toast } = useToast();

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const posts = await getPosts();
            const found = posts.find(p => p.slug === CONFIG_SLUG);

            if (found) {
                setConfigPost(found);
                try {
                    const cleanJson = found.content.rendered.replace(/<[^>]*>?/gm, '');
                    const parsed = JSON.parse(cleanJson);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setPartners(parsed);
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse partners config", e);
                }
            }

            // Fallback to defaults if no config or empty
            setPartners(DEFAULT_PARTNERS);

        } catch (error) {
            console.error(error);
            // Even on error, show defaults
            setPartners(DEFAULT_PARTNERS);
            toast({ title: "Error", description: "Failed to load configuration. Showing defaults.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async (newPartners: PartnerItem[]) => {
        setSaving(true);
        const jsonString = JSON.stringify(newPartners);

        try {
            if (configPost) {
                await updatePost(configPost.id, {
                    content: jsonString,
                });
                toast({ title: "Saved", description: "Partners list updated." });
            } else {
                const newPost = await createPost({
                    title: "System Config: Partners",
                    content: jsonString,
                    slug: CONFIG_SLUG,
                    status: 'private'
                });
                setConfigPost(newPost);
                toast({ title: "Created", description: "Configuration initialized." });
            }
            setPartners(newPartners);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
        } finally {
            setSaving(false);
            setIsDialogOpen(false);
        }
    };

    const handleEdit = (item: PartnerItem) => {
        setEditingId(item.id);
        setTempName(item.name);
        setTempLink(item.link);
        setTempLogoUrl(item.logoUrl);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setTempName("");
        setTempLink("");
        setTempLogoUrl("");
        setIsDialogOpen(true);
    };

    const handleDialogSave = () => {
        if (!tempLogoUrl) {
            toast({ title: "Missing Logo", description: "Please select a logo.", variant: "destructive" });
            return;
        }

        const newItem: PartnerItem = {
            id: editingId || crypto.randomUUID(),
            name: tempName,
            link: tempLink,
            logoUrl: tempLogoUrl
        };

        let newPartners;
        if (editingId) {
            newPartners = partners.map(p => p.id === editingId ? newItem : p);
        } else {
            newPartners = [...partners, newItem];
        }

        saveConfig(newPartners);
    };

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure?")) return;
        const newPartners = partners.filter(p => p.id !== id);
        saveConfig(newPartners);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Partners Settings</h2>
                    <p className="text-sm text-gray-500">Manage partner logos displayed on homepage.</p>
                </div>
                <Button onClick={handleCreate} disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Partner
                </Button>
            </div>

            <div className="border rounded-lg bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Logo</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Link</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : partners.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                                    No partners defined. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            partners.map((partner) => (
                                <TableRow key={partner.id}>
                                    <TableCell>
                                        <img
                                            src={partner.logoUrl}
                                            alt={partner.name}
                                            className="w-16 h-12 object-contain"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{partner.name || "—"}</TableCell>
                                    <TableCell>
                                        {partner.link ? (
                                            <a href={partner.link} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline">
                                                {partner.link} <ExternalLink className="w-3 h-3 ml-1" />
                                            </a>
                                        ) : "—"}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(partner)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(partner.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Partner" : "Add Partner"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Partner Name</Label>
                            <Input value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="e.g. My Company" />
                        </div>
                        <div className="space-y-2">
                            <Label>Website Link</Label>
                            <Input value={tempLink} onChange={(e) => setTempLink(e.target.value)} placeholder="https://example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Logo</Label>
                            <MediaPicker value={tempLogoUrl} onChange={setTempLogoUrl} />
                        </div>
                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleDialogSave} disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {editingId ? "Update" : "Add"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
