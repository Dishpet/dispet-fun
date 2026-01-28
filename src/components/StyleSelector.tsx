import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Palette, Zap, Gamepad2, Cpu, SmilePlus, Box, Clock, Paintbrush, Cog, Moon, Wand2, Minus, Shapes, Sparkles, Droplets, CircleDot, MinusSquare, Brush } from "lucide-react";

// Import style images
import synthwaveImg from "@/assets/styles/synthwave.png";
import gtaImg from "@/assets/styles/gta.png";
import cyberpunkImg from "@/assets/styles/cyberpunk.png";
import cartoonImg from "@/assets/styles/cartoon-mascot.png";
import retroImg from "@/assets/styles/vintage.png";
import inkpunkImg from "@/assets/styles/inkpunk.png";
import fantasyImg from "@/assets/styles/fantasy.png";
import abstractImg from "@/assets/styles/abstract-geometry.png";

// Placeholder for new styles (using existing images as fallback until real ones are added)
const animeImg = cartoonImg; // TODO: Add proper anime style image
const threeDImg = abstractImg; // TODO: Add proper 3D style image
const steampunkImg = retroImg; // TODO: Add proper steampunk style image
const noirImg = gtaImg; // TODO: Add proper noir style image
const minimalistImg = abstractImg; // TODO: Add proper minimalist style image

export const styles = [
  { id: 'no-style', name: 'No Style / Basic', icon: Minus, image: cartoonImg, description: 'Čisti karakter bez dodatnih stilova' },
  { id: 'cartoon', name: 'Cartoon / Mascot', icon: SmilePlus, image: cartoonImg, description: 'Razigrani maskota stil' },
  { id: 'synthwave', name: 'Synthwave', icon: Palette, image: synthwaveImg, description: 'Retro 80-ih neon vibra' },
  { id: 'gta', name: 'GTA Style', icon: Gamepad2, image: gtaImg, description: 'Smjela strip estetika' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: Cpu, image: cyberpunkImg, description: 'Futuristička neon tehnologija' },
  { id: 'anime', name: 'Anime Style', icon: Sparkles, image: animeImg, description: 'Japanski anime stil' },
  { id: '3d', name: '3D Stylized', icon: Box, image: threeDImg, description: 'Stilizirani 3D model' },
  { id: 'retro', name: 'Retro / Vintage', icon: Clock, image: retroImg, description: 'Vintage poster umjetnost' },
  { id: 'inkpunk', name: 'Inkpunk Style', icon: Paintbrush, image: inkpunkImg, description: 'Kaotične mrlje tinte' },
  { id: 'steampunk', name: 'Steampunk', icon: Cog, image: steampunkImg, description: 'Mehanički mjedeni stil' },
  { id: 'noir', name: 'Noir / Dark Comic', icon: Moon, image: noirImg, description: 'Crno-bijeli strip noir' },
  { id: 'fantasy', name: 'Fantasy / RPG', icon: Wand2, image: fantasyImg, description: 'Magični RPG stil' },
  { id: 'minimalist', name: 'Minimalist Modern', icon: MinusSquare, image: minimalistImg, description: 'Čisti, jednostavni oblici' },
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
