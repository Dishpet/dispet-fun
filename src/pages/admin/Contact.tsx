import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, MapPin, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { getPosts, getPostBySlug, createPost, updatePost } from "@/integrations/wordpress/posts";
import { WPPost } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";

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

// Legacy interface for backward compatibility migration
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
            // Use specific slug fetch for reliability, WITH AUTH to find private/draft posts
            const found = await getPostBySlug(CONFIG_SLUG, true);

            if (found) {
                setConfigPost(found);
                try {
                    const cleanJson = found.content.rendered.replace(/<[^>]*>?/gm, '');
                    const parsed = JSON.parse(cleanJson) as LegacyContactConfig;
                    if (parsed && typeof parsed === 'object') {
                        // Migrate legacy single strings to arrays if needed
                        const emails = parsed.emails || (parsed.email ? [parsed.email] : DEFAULT_CONTACT.emails);
                        const phones = parsed.phones || (parsed.phone ? [parsed.phone] : DEFAULT_CONTACT.phones);

                        setConfig({
                            location: parsed.location || DEFAULT_CONTACT.location,
                            emails,
                            phones
                        });
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse contact config", e);
                }
            }

            // Fallback (Defaults already set in state)
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load configuration", variant: "destructive" });
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
                    status: 'publish' // Ensure it's public so frontend can read it
                });
                toast({ title: "Saved", description: "Contact info updated." });
            } else {
                const newPost = await createPost({
                    title: "System Config: Contact",
                    content: jsonString,
                    slug: CONFIG_SLUG,
                    status: 'publish' // Public for frontend access
                });
                setConfigPost(newPost);
                toast({ title: "Created", description: "Configuration initialized." });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Contact Settings</h2>
                    <p className="text-sm text-gray-500">Manage contact information displayed on the website.</p>
                </div>
                <Button onClick={handleSave} disabled={loading || saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                    {/* Location Section */}
                    <div className="space-y-4 p-6 border rounded-xl bg-white shadow-sm h-fit">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <MapPin className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Location</h3>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Address / City</Label>
                            <Input
                                id="location"
                                value={config.location}
                                onChange={(e) => setConfig({ ...config, location: e.target.value })}
                                placeholder="e.g. Split, Croatia"
                            />
                            <p className="text-xs text-gray-400">Fixed to one location.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Emails Section */}
                        <div className="space-y-4 p-6 border rounded-xl bg-white shadow-sm">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-primary" />
                                    <h3 className="font-semibold">Email Addresses</h3>
                                </div>
                                <Button variant="ghost" size="sm" onClick={addEmail}>
                                    <Plus className="w-4 h-4 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {config.emails.map((email, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={email}
                                            onChange={(e) => updateEmail(index, e.target.value)}
                                            placeholder="info@example.com"
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => removeEmail(index)} disabled={config.emails.length === 1}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Phones Section */}
                        <div className="space-y-4 p-6 border rounded-xl bg-white shadow-sm">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-primary" />
                                    <h3 className="font-semibold">Phone Numbers</h3>
                                </div>
                                <Button variant="ghost" size="sm" onClick={addPhone}>
                                    <Plus className="w-4 h-4 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {config.phones.map((phone, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={phone}
                                            onChange={(e) => updatePhone(index, e.target.value)}
                                            placeholder="+385 00 000 000"
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => removePhone(index)} disabled={config.phones.length === 1}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
