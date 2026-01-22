import { Card } from "@/components/ui/card";
import { Check, Smartphone, Monitor, LayoutGrid, Image as ImageIcon } from "lucide-react";

export type SocialPlatform = 'instagram' | 'facebook';

export type SocialTemplateId =
    | 'ig-square' | 'ig-portrait' | 'ig-story'
    | 'fb-landscape' | 'fb-portrait' | 'fb-square';

export interface SocialTemplate {
    id: SocialTemplateId;
    name: string;
    width: number;
    height: number;
    platform: SocialPlatform;
    icon?: any;
    description: string;
    gradient: string;
}

export const INSTAGRAM_TEMPLATES: SocialTemplate[] = [
    {
        id: 'ig-square',
        name: 'Square Post',
        width: 1080,
        height: 1080,
        platform: 'instagram',
        icon: LayoutGrid,
        description: 'Classic 1:1 format. Perfect for feed posts.',
        gradient: 'from-purple-500 via-pink-500 to-orange-500'
    },
    {
        id: 'ig-portrait',
        name: 'Portrait (4:5)',
        width: 1080,
        height: 1350,
        platform: 'instagram',
        icon: ImageIcon,
        description: 'Tall 4:5 format. Takes up more screen space.',
        gradient: 'from-purple-500 via-pink-500 to-orange-500'
    },
    {
        id: 'ig-story',
        name: 'Story / Reel',
        width: 1080,
        height: 1920,
        platform: 'instagram',
        icon: Smartphone,
        description: 'Full screen 9:16. For Stories and Reels.',
        gradient: 'from-purple-500 via-pink-500 to-orange-500'
    }
];

export const FACEBOOK_TEMPLATES: SocialTemplate[] = [
    {
        id: 'fb-landscape',
        name: 'Landscape',
        width: 1200,
        height: 630,
        platform: 'facebook',
        icon: Monitor,
        description: 'Standard horizontal format. Best for shared links.',
        gradient: 'from-blue-600 to-blue-400'
    },
    {
        id: 'fb-portrait',
        name: 'Portrait',
        width: 1080,
        height: 1350,
        platform: 'facebook',
        icon: Smartphone,
        description: 'Mobile-first vertical format.',
        gradient: 'from-blue-600 to-blue-400'
    },
    {
        id: 'fb-square',
        name: 'Square',
        width: 1080,
        height: 1080,
        platform: 'facebook',
        icon: LayoutGrid,
        description: 'Versatile 1:1 format.',
        gradient: 'from-blue-600 to-blue-400'
    }
];

interface SocialTemplateSelectorProps {
    platform: SocialPlatform;
    selectedTemplateId: string | null;
    onSelect: (template: SocialTemplate) => void;
}

export const SocialTemplateSelector = ({ platform, selectedTemplateId, onSelect }: SocialTemplateSelectorProps) => {
    const templates = platform === 'instagram' ? INSTAGRAM_TEMPLATES : FACEBOOK_TEMPLATES;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                const ratio = template.width / template.height;
                const Icon = template.icon || LayoutGrid;

                return (
                    <Card
                        key={template.id}
                        className={`
                            group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-strong
                            ${isSelected ? 'ring-2 ring-primary border-primary shadow-medium' : 'border-border hover:border-primary/50'}
                        `}
                        onClick={() => onSelect(template)}
                    >
                        {/* Background Splash */}
                        <div className={`absolute -right-12 -top-12 w-32 h-32 bg-gradient-to-br ${template.gradient} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500 blur-2xl`} />

                        <div className="p-6 relative z-10 flex flex-col items-center text-center space-y-4">

                            {/* Icon Badge */}
                            <div className={`
                                p-3 rounded-xl bg-gradient-to-br ${template.gradient} text-white shadow-lg
                                group-hover:scale-110 transition-transform duration-300
                            `}>
                                <Icon className="w-6 h-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-sans font-bold text-lg text-foreground">{template.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                            </div>

                            {/* Visual Ratio Preview */}
                            <div className="w-full flex justify-center py-4">
                                <div className="p-1 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 group-hover:border-primary/30 transition-colors">
                                    <div
                                        className={`rounded bg-gradient-to-br ${template.gradient} opacity-20 group-hover:opacity-30 transition-opacity`}
                                        style={{
                                            width: '80px',
                                            height: `${80 / ratio}px`
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="inline-flex items-center text-xs font-mono text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                                {template.width}px × {template.height}px
                            </div>

                            {isSelected && (
                                <div className="absolute top-2 right-2 p-1 bg-primary text-white rounded-full shadow-lg">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};
