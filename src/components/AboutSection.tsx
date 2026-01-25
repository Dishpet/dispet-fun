
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

import homeCard1 from "@/assets/home-card (1).png";
import homeCard2 from "@/assets/home-card (2).png";
import homeCard3 from "@/assets/home-card (3).png";
import homeCard4 from "@/assets/home-card (4).png";

export const features = [
    {
        image: homeCard1,
        title: "Dobrodošli u srce Dišpeta...",
        description: "...gdje se rađa strast prema sportu i radosti djetinjstva. Mi smo zajednica koja dijeli istu želju - potaknuti djecu da vole sport kroz iskustvo koje će pamtiti cijeli život.",
        color: "bg-[#00aeef]/10",
        borderColor: "border-[#00aeef]/20",
        containerClass: "md:col-span-7 md:rotate-[-2deg] hover:rotate-0 transition-transform duration-500 hover:z-20",
        imageClass: "aspect-[4/3] rotate-1"
    },
    {
        image: homeCard2,
        title: "Čarobni svijet Dišpeta...",
        description: "...specijalno dizajniranog događaja za djecu od 3 do 8 godina. Svaki trenutak ispunjen smijehom, igrom i sportskim užicima stvara nezaboravne uspomene koje će vaša djeca nositi kroz cijeli život.",
        color: "bg-[#ad00e9]/10",
        borderColor: "border-[#ad00e9]/20",
        containerClass: "md:col-span-5 md:mt-16 md:rotate-[3deg] hover:rotate-0 transition-transform duration-500 hover:z-20",
        imageClass: "aspect-square -rotate-2"
    },
    {
        image: homeCard3,
        title: "Sport postaje igra...",
        description: "...a igra postaje avantura! Naša događanja potiću ljubav prema tjelesnim aktivnostima kroz raznovrsne igre i profesionalne trenere, nudeći djeci priliku da istraže, uče i zabavljaju se na jedinstven način.",
        color: "bg-[#00ab98]/10",
        borderColor: "border-[#00ab98]/20",
        containerClass: "md:col-span-5 md:mt-20 md:rotate-[-2deg] hover:rotate-0 transition-transform duration-500 hover:z-20",
        imageClass: "aspect-square rotate-2"
    },
    {
        image: homeCard4,
        title: "Dišpet ne poznaje dosadu!",
        description: "Naša igrališta pružaju djeci prostor za istraživanje različitih sportova, razvijanje vještina i stvaranje prijateljstava, a svako dijete ima priliku postati pravi mali heroj svoje priče.",
        color: "bg-[#e78fab]/10",
        borderColor: "border-[#e78fab]/20",
        containerClass: "md:col-span-7 md:mt-8 md:rotate-[2deg] hover:rotate-0 transition-transform duration-500 hover:z-20",
        imageClass: "aspect-[16/9] -rotate-1"
    }
];

export const AboutHeader = () => (
    <section className="-mt-32 md:mt-0 pt-0 pb-12 bg-white relative overflow-hidden">
        <div className="container px-4 mx-auto relative z-10">
            <div className="text-center space-y-6 max-w-4xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-black text-[#e83e70] font-['DynaPuff'] tracking-wide leading-tight"
                >
                    Upoznajte Dišpet...
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-xl md:text-2xl text-gray-600 font-medium leading-relaxed"
                >
                    ...besplatno sportsko događanje za djecu predškolske i rane školske dobi. Očekujte smijeh, igru i mnogo sporta!
                </motion.p>
            </div>
        </div>
    </section>
);

export const AboutCards = () => (
    <section className="py-12 md:py-20 bg-white relative overflow-hidden">
        <div className="container px-4 mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-x-12 max-w-7xl mx-auto items-start">
                {features.map((feature, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        className={feature.containerClass}
                    >
                        <Card className={`group p-4 md:p-6 h-full border-[3px] ${feature.borderColor} ${feature.color} backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]`}>
                            <div className="flex flex-col gap-6 h-full">
                                <div className="space-y-3 px-2 pt-2 text-center">
                                    <h3 className="text-2xl md:text-3xl font-black font-['DynaPuff'] text-gray-900 leading-tight">
                                        {feature.title}
                                    </h3>
                                </div>
                                <div className={`relative w-full rounded-[2rem] overflow-hidden shadow-md border-4 border-white ${feature.imageClass}`}>
                                    <img
                                        src={feature.image}
                                        alt={feature.title}
                                        className="w-full h-full object-contain bg-white transform group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 text-center z-10">
                                        <p className="text-lg text-gray-800 font-bold leading-relaxed font-['DynaPuff'] drop-shadow-sm">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

interface AboutVideoSliderProps {
    currentIndex: number;
    onDotClick: (index: number) => void;
}

export const AboutVideoSlider = ({ currentIndex, onDotClick }: AboutVideoSliderProps) => {
    return (
        <>
            {/* Dark Overlay */}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0044bf]/40 to-[#ad00e9]/40 z-10" />

            {/* Content Container */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                    >
                        {/* Title - Top Left */}
                        <motion.h3
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="absolute top-9 left-4 right-4 md:top-52 md:left-12 md:right-auto text-xl md:text-5xl font-black font-['DynaPuff'] text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-wide md:max-w-[50%] text-left"
                        >
                            {features[currentIndex].title}
                        </motion.h3>

                        {/* Description - Desktop Only - Boxed Overlay Bottom Right */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="hidden md:block absolute bottom-64 right-12 max-w-[65%] pointer-events-auto text-right"
                        >
                            <span className="bg-white px-6 py-3 shadow-lg box-decoration-clone text-xl font-bold text-black leading-[3.5rem]">
                                {features[currentIndex].description}
                            </span>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>

                {/* Dots - Centered */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:bottom-8 flex gap-2 md:gap-3 pointer-events-auto">
                    {features.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => onDotClick(idx)}
                            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${idx === currentIndex
                                ? "bg-[#43bfe6] scale-125"
                                : "bg-white/50 hover:bg-white/80"
                                }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

export const AboutDescription = ({ currentIndex }: { currentIndex: number }) => {
    return (
        <div className="relative z-40 bg-white -mt-2 pb-8 md:hidden">
            <div className="container mx-auto px-4">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="text-center text-lg md:text-2xl font-medium text-gray-600 leading-relaxed max-w-4xl mx-auto drop-shadow-sm"
                    >
                        {features[currentIndex].description}
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
};

export const AboutSection = () => {
    return (
        <>
            <AboutHeader />
            <AboutCards />
        </>
    );
};
