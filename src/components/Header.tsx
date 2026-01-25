import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, User, ChevronLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import logo from "@/assets/dispet-logo-symbol-bg.png";
import { useCart } from "@/contexts/CartContext";
import { JoinModal } from "@/components/JoinModal";

const NAV_ITEMS = [
    { name: "POČETNA", to: "/" },
    { name: "TRGOVINA", to: "/shop" },
    { name: "BLOG", to: "/blog" },
    { name: "DJEČJI KUTAK", to: "/games" },
    { name: "KONTAKT", to: "/contact" },
];

export const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const { cartItems } = useCart();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const navLinkClass = (path: string) => cn(
        "text-sm lg:text-base font-heading font-bold transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap",
        location.pathname === path
            ? (isScrolled ? "text-[#e83e70]" : "text-white")
            : (isScrolled ? "text-gray-600 hover:text-[#43bfe6]" : "text-white/90 hover:text-white")
    );

    const mobileNavLinkClass = (path: string) => cn(
        "text-xl font-heading font-bold py-3 px-6 rounded-2xl transition-all duration-300 text-center",
        location.pathname === path
            ? "bg-gradient-to-r from-[#e83e70] to-[#43bfe6] bg-clip-text text-transparent scale-105"
            : "text-gray-700 hover:bg-gray-50 hover:text-[#e83e70] hover:scale-105"
    );

    const iconClass = isScrolled ? "text-gray-800 hover:text-[#e83e70]" : "text-white hover:text-white/80";

    const btnRef = useRef<HTMLButtonElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const btn = btnRef.current;
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        btn.style.setProperty("--x", `${x}px`);
        btn.style.setProperty("--y", `${y}px`);
    };

    return (
        <>
            <header className={cn(
                "fixed top-0 left-0 right-0 z-[200] w-full transition-all duration-300",
                isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
            )}>
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">

                        {/* Left: Navigation (Desktop) & Back Button (Mobile) */}
                        <div className="flex items-center justify-start">
                            {/* Mobile Back Button - Only on Shop page, and NOT in fullscreen */}
                            {location.pathname === '/shop' && searchParams.get('fullscreen') !== 'true' && (
                                <button
                                    onClick={() => {
                                        if (searchParams.get('mode') === 'customizing') {
                                            setSearchParams({}); // Effectively goes back to showcase
                                        } else {
                                            navigate(-1);
                                        }
                                    }}
                                    className={cn("p-2 -ml-2 mr-4 md:mr-0 xl:mr-2", iconClass)}
                                    aria-label="Go back"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                            )}

                            <nav className="hidden md:flex items-center gap-1 xl:gap-6">
                                {NAV_ITEMS.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.to}
                                        className={navLinkClass(item.to)}
                                        onClick={() => {
                                            if (item.to === '/shop' && location.pathname === '/shop') {
                                                window.dispatchEvent(new Event('reset-shop-view'));
                                            }
                                        }}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Center: Logo */}
                        <div className="flex justify-center">
                            <Link to="/" className="flex items-center group">
                                <img
                                    src={logo}
                                    alt="Roko Logo"
                                    className="h-12 w-12 md:h-16 md:w-16 object-contain transition-transform group-hover:scale-110 duration-300"
                                />
                            </Link>
                        </div>

                        {/* Right: Actions & Mobile Menu */}
                        <div className="flex items-center justify-end gap-4 lg:gap-6">
                            {/* Desktop Actions */}
                            <div className="hidden md:flex items-center gap-4 lg:gap-6">
                                <Link to="/cart" className={cn("relative transition-colors", iconClass)}>
                                    <ShoppingCart className="w-6 h-6" fill="currentColor" />
                                    {cartItems.length > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-[#e83e70] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                            {cartItems.length}
                                        </span>
                                    )}
                                </Link>
                                <Link to="/account" className={cn("transition-colors", iconClass)}>
                                    <User className="w-6 h-6" fill="currentColor" />
                                </Link>
                                <Button
                                    ref={btnRef}
                                    variant="ghost"
                                    className={cn(
                                        "relative group overflow-hidden rounded-full font-heading font-bold transition-all border-2",
                                        isScrolled
                                            ? "text-[#e83e70] border-[#e83e70] hover:bg-[#e83e70]/5"
                                            : "text-white border-white hover:bg-white/10"
                                    )}
                                    onClick={() => setIsJoinModalOpen(true)}
                                    onMouseMove={handleMouseMove}
                                >
                                    <span className="relative z-10">PRIDRUŽI SE</span>
                                    {/* Spotlight Gradient Border */}
                                    <div
                                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                        style={{
                                            background: "radial-gradient(100px circle at var(--x) var(--y), #00ffbf, #519fff, transparent 100%)",
                                            mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                                            WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                                            maskComposite: "exclude",
                                            WebkitMaskComposite: "xor",
                                            padding: "2px" // Matches border width
                                        }}
                                    />
                                </Button>
                            </div>

                            {/* Mobile Actions (Cart + Menu) */}
                            <div className="flex md:hidden items-center gap-4">
                                <Link to="/cart" className={cn("relative transition-colors", iconClass)}>
                                    <ShoppingCart className="w-6 h-6" fill="currentColor" />
                                    {cartItems.length > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-[#e83e70] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                            {cartItems.length}
                                        </span>
                                    )}
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "hover:bg-white/20 p-0",
                                        isScrolled ? "text-gray-800" : "text-white"
                                    )}
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                >
                                    <Menu className="h-8 w-8" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>



            </header >

            {/* Mobile Menu Modal */}
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[210] animate-in fade-in duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="md:hidden fixed inset-0 z-[220] flex items-center justify-center p-4 pointer-events-none">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 pointer-events-auto animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto relative">
                            {/* Close Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Logo */}
                            <div className="flex justify-center mb-8">
                                <img src={logo} alt="Roko Logo" className="h-20 w-20 object-contain" />
                            </div>

                            {/* Navigation Links */}
                            <nav className="flex flex-col gap-2">
                                {NAV_ITEMS.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.to}
                                        className={mobileNavLinkClass(item.to)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                                <div className="h-px bg-gray-100 my-2" />

                                <div className="flex justify-center gap-8 py-4">
                                    <Link to="/cart" className="relative text-gray-700 hover:text-[#e83e70] transition-colors">
                                        <ShoppingCart className="w-8 h-8" fill="currentColor" />
                                        {cartItems.length > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-[#e83e70] text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                                                {cartItems.length}
                                            </span>
                                        )}
                                    </Link>
                                    <Link to="/account" className="text-gray-700 hover:text-[#e83e70] transition-colors">
                                        <User className="w-8 h-8" fill="currentColor" />
                                    </Link>
                                </div>

                                <div className="mt-2">
                                    <Button
                                        className={cn(
                                            "w-full text-white font-heading font-bold rounded-full py-6 text-lg shadow-lg",
                                            ['/shop', '/cart', '/checkout'].includes(location.pathname)
                                                ? "bg-gradient-to-br from-[#00ffbf] to-[#0089cd]"
                                                : "bg-gradient-to-br from-[#0044bf] to-[#ad00e9]"
                                        )}
                                        onClick={() => {
                                            setIsJoinModalOpen(true);
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        PRIDRUŽI SE
                                    </Button>
                                </div>
                            </nav>
                        </div>
                    </div>
                </>
            )}
            <JoinModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
        </>
    );
};
