import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Instagram, Facebook, Sparkles } from "lucide-react";
import { SocialTemplateSelector, SocialTemplate } from "./SocialTemplateSelector";
import { SocialComposer } from "./SocialComposer";

export const SocialMediaGenerator = () => {
    const [activeTemplate, setActiveTemplate] = useState<SocialTemplate | null>(null);

    const handleBack = () => {
        setActiveTemplate(null);
    };

    if (activeTemplate) {
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
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px] h-12 bg-gray-100/80 p-1 rounded-full border border-gray-200 shadow-inner">
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
            </Tabs>
        </div>
    );
};
