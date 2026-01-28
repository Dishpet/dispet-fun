import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Instagram, Facebook, Sparkles } from "lucide-react";
import { SocialTemplateSelector, SocialTemplate } from "./SocialTemplateSelector";
import { SocialComposer } from "./SocialComposer";
import { BrandedPostComposer } from "./BrandedPostComposer";

export const SocialMediaGenerator = () => {
    const [activeTemplate, setActiveTemplate] = useState<SocialTemplate | null>(null);

    const handleBack = () => {
        setActiveTemplate(null);
    };

    if (activeTemplate) {
        if (activeTemplate.id.startsWith('branded-')) {
            return <BrandedPostComposer template={activeTemplate} onBack={handleBack} />;
        }
        return <SocialComposer template={activeTemplate} onBack={handleBack} />;
    }

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="mb-8 space-y-2">
                <h2 className="text-3xl font-sans font-bold text-gray-900 tracking-tight">Create New Post</h2>
                <p className="text-muted-foreground font-sans text-lg">Select a platform and format to start designing with AI assistance.</p>
            </div>

            <Tabs defaultValue="instagram" className="w-full space-y-8">
                <div className="flex justify-center">
                    <TabsList className="grid w-full grid-cols-3 max-w-[600px] h-12 bg-gray-100/80 p-1 rounded-full border border-gray-200 shadow-inner">
                        <TabsTrigger
                            value="instagram"
                            className="flex items-center gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all text-base font-medium"
                        >
                            <Instagram className="w-4 h-4" /> Instagram
                        </TabsTrigger>
                        <TabsTrigger
                            value="facebook"
                            className="flex items-center gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-base font-medium"
                        >
                            <Facebook className="w-4 h-4" /> Facebook
                        </TabsTrigger>
                        <TabsTrigger
                            value="branded"
                            className="flex items-center gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm transition-all text-base font-medium"
                        >
                            <Sparkles className="w-4 h-4" /> Branded
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="instagram" className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                            <Instagram className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-sans font-semibold">Instagram Formats</h3>
                    </div>
                    <SocialTemplateSelector
                        platform="instagram"
                        selectedTemplateId={null}
                        onSelect={setActiveTemplate}
                    />
                </TabsContent>

                <TabsContent value="facebook" className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Facebook className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-sans font-semibold">Facebook Formats</h3>
                    </div>
                    <SocialTemplateSelector
                        platform="facebook"
                        selectedTemplateId={null}
                        onSelect={setActiveTemplate}
                    />
                </TabsContent>

                <TabsContent value="branded" className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-sans font-semibold">Branded Overlays</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Zabava Template */}
                        <div
                            onClick={() => setActiveTemplate({ id: 'branded-zabava', name: 'Zabava Overlay', platform: 'instagram', format: 'story', width: 1080, height: 1920, description: 'Sporty and fun overlay with dynamic shapes.' })}
                            className="group cursor-pointer rounded-2xl border-2 border-slate-100 bg-white p-4 transition-all hover:border-purple-500 hover:shadow-lg"
                        >
                            <div className="aspect-[9/16] w-full rounded-xl bg-slate-100 mb-4 overflow-hidden relative">
                                <div className="absolute inset-0 bg-[#0f172a] mask-zabava-preview"></div>
                                <div className="absolute bottom-8 left-8 text-white font-black text-3xl uppercase">Zabava</div>
                            </div>
                            <h4 className="font-bold text-slate-900">Zabava Style</h4>
                            <p className="text-sm text-slate-500">Pink & Blue dynamic shapes</p>
                        </div>

                        {/* Zdravlje Template */}
                        <div
                            onClick={() => setActiveTemplate({ id: 'branded-zdravlje', name: 'Zdravlje Overlay', platform: 'instagram', format: 'story', width: 1080, height: 1920, description: 'Health focused overlay with soft curves.' })}
                            className="group cursor-pointer rounded-2xl border-2 border-slate-100 bg-white p-4 transition-all hover:green-500 hover:shadow-lg"
                        >
                            <div className="aspect-[9/16] w-full rounded-xl bg-slate-100 mb-4 overflow-hidden relative">
                                <div className="absolute inset-0 bg-[#0f172a] mask-zdravlje-preview"></div>
                                <div className="absolute bottom-8 left-8 text-white font-black text-3xl uppercase">Zdravlje</div>
                            </div>
                            <h4 className="font-bold text-slate-900">Zdravlje Style</h4>
                            <p className="text-sm text-slate-500">Green & Yellow organic shapes</p>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
