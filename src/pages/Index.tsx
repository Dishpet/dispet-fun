import { useRef, useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { Partners } from "@/components/Partners";
import { Gallery } from "@/components/Gallery";
import { BlogSection } from "@/components/BlogSection";
import bannerImage from "@/assets/banner-image.jpg";
import bannerVideo from "@/assets/banner-video.webm";
import dispetLoop from "@/assets/dispet-loop.mp4";
import cloudsTopSvg from "@/assets/clouds-top.svg";
import cloudsBottomSvg from "@/assets/clouds-bottom.svg";
import cloudsTopVideo from "@/assets/clouds-top-video.svg";
import cloudsBottomVideo from "@/assets/clouds-bottom-video.svg";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AboutHeader, AboutVideoSlider, AboutDescription, features } from "@/components/AboutSection";

const Index = () => {
  const generatorRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const scrollToGenerator = () => {
    generatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <Hero onCreateClick={scrollToGenerator} />

      {/* About Header (Title) */}
      <AboutHeader />

      {/* Dispet Loop Video Section */}
      <div className="relative w-full h-auto overflow-hidden">
        {/* Top Clouds Overlay */}
        <img
          src={cloudsBottomVideo}
          alt=""
          className="absolute top-0 left-0 min-w-[101%] w-[101%] -ml-[1px] z-30 -mt-1"
        />

        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover block"
        >
          <source src={dispetLoop} type="video/mp4" />
        </video>

        {/* Text Overlay Slider */}
        <AboutVideoSlider
          currentIndex={currentIndex}
          onDotClick={setCurrentIndex}
        />

        {/* Bottom Clouds Overlay */}
        <img
          src={cloudsTopVideo}
          alt=""
          className="absolute bottom-0 left-0 min-w-[101%] w-[101%] -ml-[1px] z-30 -mb-1"
        />
      </div>

      {/* Description Slider (Below Video) */}
      <AboutDescription currentIndex={currentIndex} />

      {/* Shop CTA Section */}
      <div ref={generatorRef} className="w-full bg-white relative z-40">

        {/* Text Header */}
        <div className="container mx-auto px-4 pt-12 pb-8 relative z-50 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-[#43bfe6] font-['DynaPuff'] tracking-wide">
            Stigao je Dišpet merch!
          </h2>
        </div>

        {/* Banner Video */}
        <div className="w-full h-auto">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover block"
          >
            <source src={bannerVideo} type="video/webm" />
          </video>
        </div>

        {/* CTA Button */}
        <div className="container mx-auto px-4 py-8 md:py-12 relative z-50 text-center">
          <Link to="/shop">
            <Button
              size="lg"
              className="text-xl md:text-2xl px-12 py-8 rounded-full font-['DynaPuff'] font-bold text-white shadow-xl hover:scale-105 transition-transform"
              style={{
                background: 'linear-gradient(135deg, #00ffbf 0%, #0089cd 100%)'
              }}
            >
              POSJETI TRGOVINU
            </Button>
          </Link>
        </div>

        {/* Banner Image */}
        <div className="w-full h-auto">
          <img
            src={bannerImage}
            alt="Shop Banner"
            className="w-full h-full object-cover block"
          />
        </div>
      </div>

      <BlogSection />

      <Gallery />
      <Partners />
    </div>
  );
};

export default Index;
