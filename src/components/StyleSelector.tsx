import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Palette, Zap, Gamepad2, Cpu, SmilePlus, Box, Clock, Paintbrush, Cog, Moon, Wand2, Minus, Shapes } from "lucide-react";

// Import style images
import synthwaveImg from "@/assets/styles/synthwave.png";
import gtaImg from "@/assets/styles/gta.png";
import cyberpunkImg from "@/assets/styles/cyberpunk.png";
import cartoonImg from "@/assets/styles/cartoon-mascot.png";
import retroImg from "@/assets/styles/vintage.png";
import inkpunkImg from "@/assets/styles/inkpunk.png";
import fantasyImg from "@/assets/styles/fantasy.png";
import abstractImg from "@/assets/styles/abstract-geometry.png";

export const styles = [
  { id: 'synthwave', name: 'Synthwave', icon: Palette, image: synthwaveImg, description: 'Retro 80-ih neon vibra' },
  { id: 'gta', name: 'GTA Stil', icon: Gamepad2, image: gtaImg, description: 'Smjela strip estetika' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: Cpu, image: cyberpunkImg, description: 'Futuristička neon tehnologija' },
  { id: 'cartoon', name: 'Crtani Film', icon: SmilePlus, image: cartoonImg, description: 'Razigrani maskota stil' },
  { id: 'retro', name: 'Retro', icon: Clock, image: retroImg, description: 'Vintage poster umjetnost' },
  { id: 'inkpunk', name: 'Inkpunk', icon: Paintbrush, image: inkpunkImg, description: 'Kaotične mrlje tinte' },
  { id: 'fantasy', name: 'Fantasy', icon: Wand2, image: fantasyImg, description: 'Magični RPG stil' },
  { id: 'abstract-geometry', name: 'Apstraktna Geometrija', icon: Shapes, image: abstractImg, description: 'Geometrijski oblici i fragmenti' },
];

interface StyleSelectorProps {
  selectedStyle: string;
  onStyleSelect: (styleId: string) => void;
}

export const StyleSelector = ({ selectedStyle, onStyleSelect }: StyleSelectorProps) => {
  return (
    <div className="w-full">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Odaberi Stil</h2>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide mask-fade-sides">
        {styles.map((style) => {
          const isSelected = selectedStyle === style.id;

          return (
            <Card
              key={style.id}
              className={cn(
                "group relative min-w-[80px] w-[100px] aspect-square cursor-pointer overflow-hidden border transition-all hover:scale-105 flex-shrink-0",
                isSelected
                  ? "border-primary"
                  : "border-transparent hover:border-primary/50"
              )}
              onClick={() => onStyleSelect(style.id)}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={style.image}
                  alt={style.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className={cn(
                  "absolute inset-0 bg-black/40 transition-opacity",
                  isSelected ? "opacity-20" : "opacity-40 group-hover:opacity-30"
                )} />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-end p-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wide drop-shadow-lg">{style.name}</h3>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
