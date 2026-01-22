import { useLocation } from "react-router-dom";
import cloudsTopSvg from "@/assets/clouds-top.svg";

// Import decorative graphic elements
import graphicElement1 from "@/assets/elements/graphic-element (1).png";
import graphicElement5 from "@/assets/elements/graphic-element (5).png";
import graphicElement9 from "@/assets/elements/graphic-element (9).png";
import graphicElement22 from "@/assets/elements/graphic-element (22).png";
import graphicElement26 from "@/assets/elements/graphic-element (26).png";
import graphicElement41 from "@/assets/elements/graphic-element (41).png";
import graphicElement48 from "@/assets/elements/graphic-element (48).png";
import graphicElement51 from "@/assets/elements/graphic-element (51).png";

interface PageHeroProps {
    title: string;
    characterImage?: string;
    children?: React.ReactNode;
    imageClassName?: string;
    isProductPage?: boolean;
}

export const PageHero = ({ title, characterImage, children, imageClassName, isProductPage = false }: PageHeroProps) => {
    const location = useLocation();
    const isShopPage = ['/shop', '/cart', '/checkout'].includes(location.pathname);

    return (
        <section className={`relative min-h-[calc(100vh-100px)] flex items-center justify-center overflow-hidden pt-0 -mt-32 ${isShopPage ? 'bg-gradient-to-br from-[#00ffbf] to-[#0089cd]' : 'bg-gradient-to-br from-[#ad00e9] to-[#0044bf]'}`}>
            {/* Clouds SVG Layer - aligned to bottom */}
            <img src={cloudsTopSvg} alt="" className="absolute bottom-0 left-0 min-w-[101%] w-[101%] -ml-[1px] h-auto z-0" />

            <div className="container relative z-10 px-4 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center max-w-7xl mx-auto">
                    {/* Left Column - Text */}
                    <div className={`${isProductPage ? 'lg:col-span-1' : 'lg:col-span-2'} text-white space-y-8 text-center lg:text-left mt-32 lg:mt-0 animate-fade-in`}>
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight drop-shadow-lg">
                                {title}
                            </h1>
                            {children}
                        </div>
                    </div>

                    {/* Right Column - Character or Custom Image */}
                    {characterImage && (
                        <div className={`relative flex justify-center lg:justify-end animate-fade-in ${isProductPage ? 'lg:col-span-2' : ''}`} style={{ animationDelay: '0.2s' }}>
                            <img
                                src={characterImage}
                                alt="Page Hero Character"
                                className={`w-full h-auto object-contain mt-[100px] ${imageClassName || 'max-w-md'}`}
                            />
                        </div>
                    )}
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
