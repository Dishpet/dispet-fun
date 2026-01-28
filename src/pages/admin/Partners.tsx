import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ExternalLink, Save, Loader2, ChevronRight, Globe, Image as ImageIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPosts, createPost, updatePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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

    // Form State (instead of Dialog)
    const [formOpen, setFormOpen] = useState(false);
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
            setPartners(DEFAULT_PARTNERS);
        } catch (error) {
            console.error(error);
            setPartners(DEFAULT_PARTNERS);
            toast({ title: "Greška", description: "Neuspješno učitavanje. Prikazane zadane postavke.", variant: "destructive" });
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
                toast({ title: "Spremljeno", description: "Popis partnera je ažuriran." });
            } else {
                const newPost = await createPost({
                    title: "System Config: Partners",
                    content: jsonString,
                    slug: CONFIG_SLUG,
                    status: 'private'
                });
                setConfigPost(newPost);
                toast({ title: "Kreirano", description: "Konfiguracija je inicijalizirana." });
            }
            setPartners(newPartners);
            setFormOpen(false);
            setEditingId(null);
        } catch (error) {
            console.error(error);
            toast({ title: "Greška", description: "Neuspješno spremanje konfiguracije", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: PartnerItem) => {
        setEditingId(item.id);
        setTempName(item.name);
        setTempLink(item.link);
        setTempLogoUrl(item.logoUrl);
        setFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCreate = () => {
        setEditingId(null);
        setTempName("");
        setTempLink("");
        setTempLogoUrl("");
        setFormOpen(prev => !prev);
    };

    const handleFormSave = () => {
        if (!tempLogoUrl) {
            toast({ title: "Nedostaje logo", description: "Molimo odaberite logo partnera.", variant: "destructive" });
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
        if (!confirm("Jeste li sigurni da želite obrisati ovog partnera?")) return;
        const newPartners = partners.filter(p => p.id !== id);
        saveConfig(newPartners);
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-8">
                <div>
                    <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                        PARTNERI
                    </h1>
                    <p className="text-slate-500 text-lg font-medium mt-1">Upravljajte logotipima partnera na naslovnici.</p>
                </div>
                <Button
                    onClick={handleCreate}
                    disabled={loading}
                    className={cn(
                        "h-12 px-6 rounded-full font-black text-xs uppercase tracking-widest shadow-lg transition-all shadow-primary/10",
                        formOpen ? "bg-slate-900" : "bg-primary"
                    )}
                >
                    {formOpen ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {formOpen ? "Zatvori Formu" : "Dodaj Partnera"}
                </Button>
            </div>

            {/* Inline Form */}
            <Collapsible open={formOpen}>
                <CollapsibleContent>
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden mb-12">
                        <div className="p-8 md:p-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                    {editingId ? "Uredi Partnera" : "Novi Partner"}
                                </h3>
                                <Badge variant="secondary" className="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[9px] px-3 py-1">Konfiguracija</Badge>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Ime Partnera</Label>
                                        <Input
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            placeholder="npr. Moja Tvrtka"
                                            className="h-12 rounded-full bg-slate-50 border-none shadow-sm focus-visible:ring-primary/20 font-bold px-6"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Web Adresa (Link)</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <Input
                                                value={tempLink}
                                                onChange={(e) => setTempLink(e.target.value)}
                                                placeholder="https://primjer.com"
                                                className="h-12 pl-11 rounded-full bg-slate-50 border-none shadow-sm focus-visible:ring-primary/20 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Logo Partnera</Label>
                                    <MediaPicker value={tempLogoUrl} onChange={setTempLogoUrl} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="ghost" onClick={() => { setFormOpen(false); setEditingId(null); }} className="h-12 px-6 rounded-full font-bold uppercase text-[10px] tracking-widest">
                                    Odustani
                                </Button>
                                <Button onClick={handleFormSave} disabled={saving} className="h-12 px-10 rounded-full bg-slate-900 hover:bg-black font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-900/10">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    {editingId ? "Ažuriraj Partnera" : "Spremi Partnera"}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            {/* Partners List (Cards) */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Učitavanje partnera...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {partners.map((partner) => (
                        <Card key={partner.id} className="group overflow-hidden border-none shadow-lg shadow-slate-200/30 bg-white rounded-[2.5rem] transition-all duration-500 hover:shadow-xl hover:shadow-slate-300/40">
                            <div className="p-8">
                                <div className="h-32 w-full rounded-[1.5rem] bg-slate-50 border border-slate-100/50 flex items-center justify-center p-6 mb-6 group-hover:bg-white transition-colors duration-500">
                                    <img
                                        src={partner.logoUrl}
                                        alt={partner.name}
                                        className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none truncate uppercase">
                                            {partner.name || "Bez imena"}
                                        </h3>
                                        {partner.link && (
                                            <a href={partner.link} target="_blank" rel="noopener noreferrer" className="flex items-center text-[10px] font-bold text-slate-400 hover:text-primary transition-colors mt-2 uppercase tracking-widest">
                                                Pregled stranice <ExternalLink className="w-3 h-3 ml-1.5" />
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(partner)}
                                            className="flex-1 h-10 rounded-full bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                        >
                                            <Pencil className="w-3 h-3 mr-2" /> Uredi
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(partner.id)}
                                            className="h-10 w-10 p-0 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {partners.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                                <ImageIcon className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 uppercase">NEMA DEFINIRANIH PARTNERA</h3>
                            <Button onClick={handleCreate} variant="outline" className="mt-6 rounded-full px-8 py-6 h-auto font-black text-[10px] uppercase tracking-widest">
                                Dodaj prvog partnera
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
