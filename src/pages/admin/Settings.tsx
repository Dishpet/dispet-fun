import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Label } from "@/components/ui/label";
import { cleanWordPressJson } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Key, ShieldCheck, Globe, UserCog } from "lucide-react";
import { getPosts, getPostBySlug, createPost, updatePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";

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

    // Local State for WP Credentials
    const [wpUser, setWpUser] = useState("");
    const [wpPass, setWpPass] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // Load WP Creds from LocalStorage
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
                    setLoading(false);
                    return;
                }
            }
        } catch (error) {
            console.error(error);
            // Don't show toast on load fail if it's just auth issues (user will see empty state)
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConnection = () => {
        localStorage.setItem('wp_username', wpUser);
        localStorage.setItem('wp_app_password', wpPass);
        toast({ title: "Connection Saved", description: "WordPress credentials saved locally." });

        // Reload config to test connection
        loadConfig();
    };

    const handleSaveConfig = async () => {
        setSaving(true);

        // Sanitize credentials (remove spaces from app password often copied from WP)
        const cleanUser = wpUser.trim();
        const cleanPass = wpPass.replace(/\s/g, '');

        if (cleanUser) {
            setWpUser(cleanUser); // Update UI state
            localStorage.setItem('wp_username', cleanUser);
        }
        if (cleanPass) {
            setWpPass(cleanPass); // Update UI state
            localStorage.setItem('wp_app_password', cleanPass);
        }

        const jsonString = JSON.stringify(config);

        try {
            if (configPost) {
                await updatePost(configPost.id, {
                    content: jsonString,
                });
                toast({ title: "Saved", description: "API Configuration updated." });
            } else {
                const newPost = await createPost({
                    title: "System Config: API Keys",
                    content: jsonString,
                    slug: CONFIG_SLUG,
                    status: 'private'
                });
                setConfigPost(newPost);
                toast({ title: "Created", description: "Configuration initialized." });
            }
        } catch (error: any) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast({
                title: "Error Saving Config",
                description: errorMessage, // Show the actual error from client.ts
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-heading mb-2">Settings</h1>
                    <p className="text-gray-500">Manage system configurations and API connections.</p>
                </div>
                <Button onClick={handleSaveConfig} disabled={loading || saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Config
                </Button>
            </div>

            {loading && !wpUser ? (
                <div className="py-20 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* WordPress Connection */}
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-700">
                                <UserCog className="w-5 h-5" />
                                WordPress Connection
                            </CardTitle>
                            <CardDescription>
                                Required to save settings. Create an Application Password in WordPress Admin {'>'} Users {'>'} Profile.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="wpUser">WP Username</Label>
                                    <Input
                                        id="wpUser"
                                        value={wpUser}
                                        onChange={(e) => setWpUser(e.target.value)}
                                        placeholder="admin"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="wpPass">Application Password</Label>
                                    <Input
                                        id="wpPass"
                                        type="password"
                                        value={wpPass}
                                        onChange={(e) => setWpPass(e.target.value)}
                                        placeholder="xxxx xxxx xxxx xxxx"
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleSaveConnection} className="mt-2">
                                Update Connection
                            </Button>
                        </CardContent>
                    </Card>

                    {/* External API Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="w-5 h-5 text-primary" />
                                Google AI Configuration
                            </CardTitle>
                            <CardDescription>
                                Configure your personal Google API Key to override the default system quota.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="googleApiKey">Google API Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="googleApiKey"
                                        type="password"
                                        value={config.googleApiKey}
                                        onChange={(e) => setConfig({ ...config, googleApiKey: e.target.value })}
                                        placeholder="AIzaSy..."
                                        className="font-mono bg-white"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Paste your key from Google AI Studio. Leave empty to use the system default.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Environment Variables (Read Only) */}
                    <Card className="bg-gray-50/50 border-gray-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base text-gray-600">
                                <ShieldCheck className="w-4 h-4" />
                                System Environment
                            </CardTitle>
                            <CardDescription>
                                These values are set at build time and cannot be changed here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">WooCommerce API Keys</label>
                                    <div className="font-mono text-sm bg-green-50 p-2 rounded border border-green-200 mt-1 text-green-700 flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3" />
                                        Configured securely on server (not exposed to browser)
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">WordPress API URL (VITE_WP_API_URL)</label>
                                    <div className="font-mono text-sm bg-white p-2 rounded border mt-1 text-gray-600 flex items-center gap-2">
                                        <Globe className="w-3 h-3 text-gray-400" />
                                        {import.meta.env.VITE_WP_API_URL || 'Default (https://wp.dispet.fun/wp-json)'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
