import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LegalModal } from './LegalModal';
import { LEGAL_CONTENT } from '@/data/legalContent';

export const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Delay slightly for better UX
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-50 bg-[#231f20] text-white p-4 border-t border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]"
                >
                    <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1 text-sm text-center md:text-left">
                            <p className="mb-2 md:mb-0">
                                <span className="mr-2">🍪</span>
                                Koristimo kolačiće kako bismo poboljšali vaše iskustvo. Saznajte više u našim &nbsp;
                                <LegalModal
                                    triggerText="Pravilima o kolačićima"
                                    title={LEGAL_CONTENT.cookies.title}
                                    content={LEGAL_CONTENT.cookies.content}
                                    className="text-[#00aeef] hover:text-[#00aeef]/80 underline"
                                />.
                            </p>
                        </div>
                        <div className="flex gap-4 items-center">
                            <Button
                                onClick={handleAccept}
                                className="bg-[#00ab98] hover:bg-[#00ab98]/90 text-white font-medium px-8"
                            >
                                Prihvati sve
                            </Button>
                            <button
                                onClick={handleAccept}
                                className="md:hidden absolute top-2 right-2 text-white/50 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
