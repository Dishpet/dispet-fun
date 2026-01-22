import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import cloudsTopSvg from "@/assets/clouds-top.svg";
import rokoWebGif from "@/assets/roko_web.gif";

// Import decorative graphic elements
import graphicElement1 from "@/assets/elements/graphic-element (1).png";
import graphicElement5 from "@/assets/elements/graphic-element (5).png";
import graphicElement9 from "@/assets/elements/graphic-element (9).png";
import graphicElement22 from "@/assets/elements/graphic-element (22).png";
import graphicElement26 from "@/assets/elements/graphic-element (26).png";
import graphicElement41 from "@/assets/elements/graphic-element (41).png";
import graphicElement48 from "@/assets/elements/graphic-element (48).png";
import graphicElement51 from "@/assets/elements/graphic-element (51).png";

interface HeroProps {
  onCreateClick: () => void;
}

export const Hero = ({ onCreateClick }: HeroProps) => {
  return (
    <section className="relative min-h-screen md:min-h-[calc(100vh-100px)] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#ad00e9] to-[#0044bf] pt-0 -mt-32">
      {/* Clouds SVG Layer - aligned to bottom */}
      <img src={cloudsTopSvg} alt="" className="absolute bottom-32 md:bottom-0 left-0 min-w-[101%] w-[101%] -ml-[1px] h-auto z-0" />

      <div className="container relative z-10 px-4 pt-12 pb-0 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column - Text */}
          <div className="lg:col-span-2 text-white space-y-6 md:space-y-8 text-center lg:text-left mt-6 md:mt-24 lg:-mt-12 animate-fade-in order-1 lg:order-1">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight drop-shadow-lg px-2 md:px-0">
                Dan zabave za djecu i odrasle
              </h1>
            </div>
          </div>

          {/* Right Column - Roko Character */}
          <div className="relative flex justify-center lg:justify-end animate-fade-in order-2 lg:order-2" style={{ animationDelay: '0.2s' }}>
            <img
              src={rokoWebGif}
              alt="Roko the Donkey"
              className="w-[80%] md:w-full max-w-md h-auto object-contain mt-0 md:mt-[100px] hover-scale"
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};
