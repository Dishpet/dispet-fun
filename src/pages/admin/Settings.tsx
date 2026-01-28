import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Label } from "@/components/ui/label";
import { cleanWordPressJson, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Key, ShieldCheck, Globe, UserCog, Database, Lock, Info, Server } from "lucide-react";
import { getPosts, getPostBySlug, createPost, updatePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const CONFIG_SLUG = "config-api-keys";

interface ApiConfig {
    googleApiKey: string;
}

const DEFAULT_CONFIG: ApiConfig = {
    googleApiKey: "",
};

export default function Settings() {
    const [configPost, setConfigPost] = useState<WPPost | null>(null);
    const [config, setConfig] = useState<ApiConfig>(DEFAULT_CONFIG);

    const [wpUser, setWpUser] = useState("");
    const [wpPass, setWpPass] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setWpUser(localStorage.getItem('wp_username') || "");
        setWpPass(localStorage.getItem('wp_app_password') || "");
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const found = await getPostBySlug(CONFIG_SLUG, true);
            if (found) {
                setConfigPost(found);
                const parsed = cleanWordPressJson(found.content.rendered);
                if (parsed && typeof parsed === 'object') {
                    setConfig({ ...DEFAULT_CONFIG, ...parsed });
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConnection = () => {
        localStorage.setItem('wp_username', wpUser);
        localStorage.setItem('wp_app_password', wpPass);
        toast({ title: "Veza Spremljena", description: "Vjerodajnice su lokalno pospremljene." });
        loadConfig();
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        const cleanUser = wpUser.trim();
        const cleanPass = wpPass.replace(/\s/g, '');

        if (cleanUser) {
            setWpUser(cleanUser);
            localStorage.setItem('wp_username', cleanUser);
        }
        if (cleanPass) {
            setWpPass(cleanPass);
            localStorage.setItem('wp_app_password', cleanPass);
        }

        const jsonString = JSON.stringify(config);

        try {
            if (configPost) {
                await updatePost(configPost.id, {
                    content: jsonString,
                });
                toast({ title: "Spremljeno", description: "Konfiguracija je ažurirana." });
            } else {
                const newPost = await createPost({
                    title: "System Config: API Keys",
                    content: jsonString,
                    slug: CONFIG_SLUG,
                    status: 'private'
                });
                setConfigPost(newPost);
                toast({ title: "Kreirano", description: "Konfiguracija je inicijalizirana." });
            }
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Greška pri spremanju",
                description: error instanceof Error ? error.message : "Nepoznata greška",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20 max-w-5xl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-8">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black font-heading text-slate-900 tracking-tight uppercase">
                        POSTAVKE
                    </h1>
                    <p className="text-slate-500 text-sm md:text-lg font-medium mt-1">Upravljajte konfiguracijom sustava i API vezama.</p>
                </div>
                <Button
                    onClick={handleSaveConfig}
                    disabled={loading || saving}
                    className="w-full md:w-auto h-12 px-8 rounded-full bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/10 transition-all"
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2 stroke-[3]" />}
                    Spremi Sve
                </Button>
            </div>

            {loading && !wpUser ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Učitavanje postavki...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* WordPress Connection */}
                    <Card className="border-none shadow-xl shadow-blue-500/5 bg-white rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-6 md:p-8 pb-4">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">WordPress Veza</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-400">Lokalne vjerodajnice</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 pt-0 space-y-6">
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start gap-4">
                                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-blue-700 leading-relaxed">
                                    Potrebno za spremanje postavki. Kreirajte "Application Password" pod Users {'>'} Profile u WordPressu.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Korisničko Ime</Label>
                                    <Input
                                        value={wpUser}
                                        onChange={(e) => setWpUser(e.target.value)}
                                        placeholder="npr. admin"
                                        className="h-12 rounded-full bg-slate-50 border-none shadow-sm font-bold px-6"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Application Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <Input
                                            type="password"
                                            value={wpPass}
                                            onChange={(e) => setWpPass(e.target.value)}
                                            placeholder="xxxx xxxx xxxx xxxx"
                                            className="h-12 pl-11 rounded-full bg-slate-50 border-none shadow-sm font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleSaveConnection}
                                className="w-full h-11 rounded-full border-slate-100 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50"
                            >
                                <Database className="w-3.5 h-3.5 mr-2" />
                                Ažuriraj Lokalnu Vezu
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Google AI Configuration */}
                    <Card className="border-none shadow-xl shadow-indigo-500/5 bg-white rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-6 md:p-8 pb-4">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                    <Key className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Google AI</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-400">Gemini API Konfiguracija</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 pt-0 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Primarni API Ključ</Label>
                                <Input
                                    type="password"
                                    value={config.googleApiKey}
                                    onChange={(e) => setConfig({ ...config, googleApiKey: e.target.value })}
                                    placeholder="AIzaSy..."
                                    className="h-12 rounded-full bg-slate-50 border-none shadow-sm font-mono text-xs px-6"
                                />
                                <p className="text-[10px] text-slate-400 font-medium px-1">
                                    Zalijepite ključ iz Google AI Studia. Ostavite prazno za zadani sistemski ključ.
                                </p>
                            </div>

                            <div className="pt-4 space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Status Sustava</label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <div className="flex items-center gap-3">
                                            <Server className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Backend Proxy</span>
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black uppercase tracking-widest">Active</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">WooCommerce Secrets</span>
                                        </div>
                                        <Badge className="bg-slate-200 text-slate-600 border-none text-[9px] font-black uppercase tracking-widest px-2.5">Secured</Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Environment Info */}
                    <Card className="lg:col-span-2 border-none shadow-lg shadow-slate-200/20 bg-slate-900 rounded-[2.5rem] overflow-hidden">
                        <div className="p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
                            <div className="space-y-2 text-center md:text-left">
                                <h3 className="text-xl font-black uppercase tracking-tight">Okruženje Sustava</h3>
                                <p className="text-slate-400 text-sm font-medium">Ove vrijednosti su zadane pri build-u i ne mogu se mjenjati ovdje.</p>
                            </div>
                            <div className="flex flex-col gap-4 min-w-[300px]">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">WordPress API URL</label>
                                    <div className="h-10 px-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex items-center">
                                        <code className="text-xs font-bold text-primary truncate">
                                            {import.meta.env.VITE_WP_API_URL || 'https://wp.dispet.fun/wp-json'}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
