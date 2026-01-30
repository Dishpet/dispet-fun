import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Instagram, Facebook } from "lucide-react";
import { SocialTemplateSelector, SocialTemplate } from "./SocialTemplateSelector";
import { MaskedPostComposer } from "./MaskedPostComposer";
import { BlobEditor } from "./BlobEditor";
import { useToast } from "@/components/ui/use-toast";

export const SocialMediaGenerator = () => {
    const [selectedFormat, setSelectedFormat] = useState<SocialTemplate | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const [viewMode, setViewMode] = useState<'templates' | 'blobs'>('templates');

    const handleFormatSelect = (template: SocialTemplate) => {
        setSelectedFormat(template);
        // Trigger file input immediately
        setTimeout(() => fileInputRef.current?.click(), 100);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            // User cancelled - reset selection
            setSelectedFormat(null);
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file type",
                description: "Please select an image file",
                variant: "destructive"
            });
            setSelectedFormat(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setUploadedImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleBack = () => {
        setUploadedImage(null);
        setSelectedFormat(null);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (viewMode === 'templates' && selectedFormat && uploadedImage) {
        return <MaskedPostComposer template={selectedFormat} uploadedImage={uploadedImage} onBack={handleBack} />;
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1 rounded-full flex gap-1 shadow-inner">
                    <button
                        onClick={() => setViewMode('templates')}
                        className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${viewMode === 'templates' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Social Templates
                    </button>
                    <button
                        onClick={() => setViewMode('blobs')}
                        className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${viewMode === 'blobs' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Blob Studio
                    </button>
                </div>
            </div>

            {viewMode === 'blobs' ? (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    <BlobEditor />
                </div>
            ) : (
                <>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="mb-8 space-y-2 text-center lg:text-left">
                        <h2 className="text-3xl font-sans font-bold text-gray-900 tracking-tight">Create New Post</h2>
                        <p className="text-muted-foreground font-sans text-lg">Select a platform and format to start designing with AI assistance.</p>
                    </div>

                    <Tabs defaultValue="instagram" className="w-full space-y-8">
                        <div className="flex justify-center lg:justify-start">
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

                        <TabsContent value="instagram">
                            <SocialTemplateSelector
                                platform="instagram"
                                onSelect={handleFormatSelect}
                                selectedTemplateId={selectedFormat?.id || null}
                            />
                        </TabsContent>

                        <TabsContent value="facebook">
                            <SocialTemplateSelector
                                platform="facebook"
                                onSelect={handleFormatSelect}
                                selectedTemplateId={selectedFormat?.id || null}
                            />
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
};
