import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, MapPin, Mail, Phone, Plus, Trash2, Globe, Building2 } from "lucide-react";
import { getPosts, getPostBySlug, createPost, updatePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONFIG_SLUG = "config-contact";

interface ContactConfig {
    location: string;
    emails: string[];
    phones: string[];
}

const DEFAULT_CONTACT: ContactConfig = {
    location: "Split, Croatia",
    emails: ["info@dispet.fun"],
    phones: ["(+385) 555 6666"]
};

interface LegacyContactConfig {
    location: string;
    email?: string;
    phone?: string;
    emails?: string[];
    phones?: string[];
}

export default function AdminContact() {
    const [configPost, setConfigPost] = useState<WPPost | null>(null);
    const [config, setConfig] = useState<ContactConfig>(DEFAULT_CONTACT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const found = await getPostBySlug(CONFIG_SLUG, true);
            if (found) {
                setConfigPost(found);
                try {
                    const cleanJson = found.content.rendered.replace(/<[^>]*>?/gm, '');
                    const parsed = JSON.parse(cleanJson) as LegacyContactConfig;
                    if (parsed && typeof parsed === 'object') {
                        const emails = parsed.emails || (parsed.email ? [parsed.email] : DEFAULT_CONTACT.emails);
                        const phones = parsed.phones || (parsed.phone ? [parsed.phone] : DEFAULT_CONTACT.phones);

                        setConfig({
                            location: parsed.location || DEFAULT_CONTACT.location,
                            emails,
                            phones
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse contact config", e);
                }
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Greška", description: "Neuspješno učitavanje konfiguracije", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const jsonString = JSON.stringify(config);

        try {
            if (configPost) {
                await updatePost(configPost.id, {
                    content: jsonString,
                    status: 'publish'
                });
                toast({ title: "Spremljeno", description: "Kontakt podaci su ažurirani." });
            } else {
                const newPost = await createPost({
                    title: "System Config: Contact",
                    content: jsonString,
                    slug: CONFIG_SLUG,
                    status: 'publish'
                });
                setConfigPost(newPost);
                toast({ title: "Kreirano", description: "Konfiguracija je inicijalizirana." });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Greška", description: "Neuspješno spremanje", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const addEmail = () => setConfig({ ...config, emails: [...config.emails, ""] });
    const removeEmail = (index: number) => {
        const newEmails = config.emails.filter((_, i) => i !== index);
        setConfig({ ...config, emails: newEmails });
    };
    const updateEmail = (index: number, value: string) => {
        const newEmails = [...config.emails];
        newEmails[index] = value;
        setConfig({ ...config, emails: newEmails });
    };

    const addPhone = () => setConfig({ ...config, phones: [...config.phones, ""] });
    const removePhone = (index: number) => {
        const newPhones = config.phones.filter((_, i) => i !== index);
        setConfig({ ...config, phones: newPhones });
    };
    const updatePhone = (index: number, value: string) => {
        const newPhones = [...config.phones];
        newPhones[index] = value;
        setConfig({ ...config, phones: newPhones });
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20 max-w-5xl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-8">
                <div>
                    <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                        KONTAKT INFO
                    </h1>
                    <p className="text-slate-500 text-lg font-medium mt-1">Upravljajte kontakt informacijama prikazanim na webu.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={loading || saving}
                    className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/10 transition-all text-white"
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2 stroke-[3]" />}
                    Spremi Promjene
                </Button>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Učitavanje podataka...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Location Section */}
                    <Card className="border-none shadow-xl shadow-blue-500/5 bg-white rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Lokacija</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-400">Adresa Sjedišta</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Adresa / Grad</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input
                                        value={config.location}
                                        onChange={(e) => setConfig({ ...config, location: e.target.value })}
                                        placeholder="npr. Split, Hrvatska"
                                        className="h-12 pl-11 rounded-full bg-slate-50 border-none shadow-sm font-bold"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-8">
                        {/* Emails Section */}
                        <Card className="border-none shadow-xl shadow-indigo-500/5 bg-white rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                            <Mail className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Email</CardTitle>
                                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-400">Kontakt Adrese</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={addEmail} className="h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider text-indigo-600 hover:bg-indigo-50">
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Dodaj
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 space-y-4">
                                {config.emails.map((email, index) => (
                                    <div key={index} className="flex gap-2 group">
                                        <Input
                                            value={email}
                                            onChange={(e) => updateEmail(index, e.target.value)}
                                            placeholder="info@primjer.com"
                                            className="h-12 rounded-full bg-slate-50 border-none shadow-sm font-bold flex-1 px-6"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeEmail(index)}
                                            disabled={config.emails.length === 1}
                                            className="h-12 w-12 rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Phones Section */}
                        <Card className="border-none shadow-xl shadow-emerald-500/5 bg-white rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                            <Phone className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Telefon</CardTitle>
                                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-400">Kontakt Brojevi</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={addPhone} className="h-8 rounded-full font-bold text-[10px] uppercase tracking-wider text-emerald-600 hover:bg-emerald-50">
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Dodaj
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 space-y-4">
                                {config.phones.map((phone, index) => (
                                    <div key={index} className="flex gap-2 group">
                                        <Input
                                            value={phone}
                                            onChange={(e) => updatePhone(index, e.target.value)}
                                            placeholder="+385 91 123 4567"
                                            className="h-12 rounded-full bg-slate-50 border-none shadow-sm font-bold flex-1 px-6"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removePhone(index)}
                                            disabled={config.phones.length === 1}
                                            className="h-12 w-12 rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
