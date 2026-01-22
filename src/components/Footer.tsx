import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import logo from "@/assets/1web-logo-whitel.png";
import rokoWave from "@/assets/roko_web_wave_orig_2.gif";
import cloudsSvg from "@/assets/clouds-bottom.svg";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LegalModal } from "./LegalModal";
import { LEGAL_CONTENT } from "@/data/legalContent";

export const Footer = () => {
    const location = useLocation();
    const isProductPage = location.pathname.startsWith('/product/');
    const isShopPage = ['/shop', '/cart', '/checkout'].includes(location.pathname);

    return (
        <footer className={cn(
            "relative w-full min-h-[650px] text-white overflow-hidden font-sans",
            isShopPage ? "bg-gradient-to-br from-[#00ffbf] to-[#0089cd]" : "bg-gradient-to-br from-[#0044bf] to-[#ad00e9]",
            isProductPage ? "pb-20 md:pb-0" : ""
        )}>
            {/* Clouds SVG Layer */}
            <img src={cloudsSvg} alt="" className="absolute top-0 left-0 min-w-[101%] w-[101%] -ml-[1px] h-auto z-0" />

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 relative z-10 min-h-[650px] flex flex-col justify-end">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 items-center">
                    {/* Left Column - Application Menu */}
                    <div className="flex flex-col items-center md:items-start space-y-3">
                        <div className="flex flex-col space-y-1 items-center md:items-start text-sm md:text-xs text-white/90">
                            {isShopPage && (
                                <LegalModal
                                    triggerText="POLITIKA DOSTAVE"
                                    title={LEGAL_CONTENT.delivery.title}
                                    content={LEGAL_CONTENT.delivery.content}
                                />
                            )}
                            <LegalModal
                                triggerText="OPĆI UVJETI POSLOVANJA"
                                title={LEGAL_CONTENT.terms.title}
                                content={LEGAL_CONTENT.terms.content}
                            />
                            <LegalModal
                                triggerText="PRAVILA PRIVATNOSTI (GDPR)"
                                title={LEGAL_CONTENT.privacy.title}
                                content={LEGAL_CONTENT.privacy.content}
                            />
                            {isShopPage && (
                                <>
                                    <LegalModal
                                        triggerText="PRAVILA O KOLAČIĆIMA"
                                        title={LEGAL_CONTENT.cookies.title}
                                        content={LEGAL_CONTENT.cookies.content}
                                    />
                                    <LegalModal
                                        triggerText="PRAVO NA POVRAT"
                                        title={LEGAL_CONTENT.returns.title}
                                        content={LEGAL_CONTENT.returns.content}
                                    />
                                </>
                            )}
                        </div>
                        <p className="text-xs text-white/50 pt-2">© 2025 Dispet. Sva prava pridržana.</p>
                    </div>

                    {/* Center Column - Logo */}
                    <div className="flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
                        <img src={logo} alt="Roko Footer Logo" className="h-40 w-auto object-contain drop-shadow-lg" />
                    </div>

                    {/* Right Column - Social Links */}
                    <div className="flex flex-col items-center md:items-end">
                        <div className="flex gap-4">
                            <a href="https://www.facebook.com/profile.php?id=61555918944052" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-300 group">
                                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:shadow-xl">
                                    <FaFacebook className="h-6 w-6 text-[#e83e70]" />
                                </div>
                            </a>
                            <a href="https://www.instagram.com/dispet.fun/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-300 group">
                                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:shadow-xl">
                                    <FaInstagram className="h-6 w-6 text-[#e83e70]" />
                                </div>
                            </a>
                            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-300 group">
                                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:shadow-xl">
                                    <FaYoutube className="h-6 w-6 text-[#e83e70]" />
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Animated Roko Character - Positioned above gradient, aligned to bottom */}
            <div className={cn(
                "absolute left-1/4 transform -translate-x-1/2 z-10 pointer-events-none transition-all duration-300",
                isProductPage ? "bottom-20 md:bottom-0" : "bottom-0"
            )}>
                <img src={rokoWave} alt="Roko Waving" className="h-40 w-auto object-contain" />
            </div>
        </footer>
    );
};
