import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { ShopScene } from '../components/3d/ShopScene';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Palette, Ruler, ChevronLeft, ChevronRight, Box, X, Star, Check, Plus, Minus, RefreshCcw } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import cloudsTopSvg from '@/assets/clouds-top.svg';
import bannerImage from '@/assets/banner-image.jpg';
import bannerVideo from '@/assets/banner-video.webm';
import { getProducts } from '@/integrations/wordpress/woocommerce';

// Import all designs
// @ts-ignore
const streetDesigns = import.meta.glob('/src/assets/design-collections/street/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' });
// @ts-ignore
const vintageDesigns = import.meta.glob('/src/assets/design-collections/vintage/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' });
// @ts-ignore
// @ts-ignore
const logoDesigns = import.meta.glob('/src/assets/design-collections/logo/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' });
// @ts-ignore
const colorCodedLogos = import.meta.glob('/src/assets/design-collections/color-coded-logo/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' });

const COLOR_TO_LOGO_MAP: Record<string, string> = {};

Object.keys(colorCodedLogos).forEach(path => {
    // Extract hex/name from filename: logo-XXXXXX.png
    const match = path.match(/logo-(.+)\.png$/);
    if (match) {
        const keyPart = match[1];
        if (keyPart === 'grey-white') {
            COLOR_TO_LOGO_MAP['#d1d5db'] = colorCodedLogos[path] as string; // Grey
            COLOR_TO_LOGO_MAP['#ffffff'] = colorCodedLogos[path] as string; // White
        } else {
            // Assume format is hex without hash
            COLOR_TO_LOGO_MAP[`#${keyPart}`] = colorCodedLogos[path] as string;
        }
    }
});

const URL_TO_FILENAME: Record<string, string> = {};

// Designs to hide from the shop
const HIDDEN_DESIGNS = [
    'street-9.png',
    'logo-4.png',
    'logo-6.png',
    'logo-8.png',
    'logo-10.png',
    'logo-11.png',
    'KIDS-BADGE.png',
    'STREET-BADGE.png',
    'VINTAGE-BADGE.png',
    'street-2.png',
    'street-4.png',
    'street-8.png'
];

// Designs to hide for specific products
const PRODUCT_RESTRICTED_DESIGNS: Record<string, string[]> = {
    cap: ['street-5.png']
};

// Helper to populate the map and filter/sort
const processDesigns = (globResult: Record<string, unknown>) => {
    // Populate URL map first
    Object.keys(globResult).forEach(path => {
        const url = globResult[path] as string;
        const filename = path.split('/').pop() || '';
        if (filename) URL_TO_FILENAME[url] = filename;
    });

    return Object.keys(globResult)
        .filter(path => {
            const filename = path.split('/').pop() || '';
            return !HIDDEN_DESIGNS.includes(filename);
        })
        .sort((a, b) => {
            const nameA = a.split('/').pop() || a;
            const nameB = b.split('/').pop() || b;
            const isBadgeA = nameA.toUpperCase().includes('BADGE');
            const isBadgeB = nameB.toUpperCase().includes('BADGE');
            if (isBadgeA && !isBadgeB) return 1;
            if (!isBadgeA && isBadgeB) return -1;
            return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
        })
        .map(key => globResult[key] as string);
};

const DESIGN_COLLECTIONS: Record<string, string[]> = {
    'Ulična Moda': processDesigns(streetDesigns),
    'Vintage Stil': processDesigns(vintageDesigns),
    'Logotip': processDesigns(logoDesigns),
};

// Flatten for initial random selection
const ALL_DESIGNS: string[] = [
    ...DESIGN_COLLECTIONS['Ulična Moda'],
    ...DESIGN_COLLECTIONS['Vintage Stil'],
    ...DESIGN_COLLECTIONS['Logotip']
];

// Placeholder for Hoodie Front (Logo 3)
const PLACEHOLDER_FRONT_DESIGN = logoDesigns['/src/assets/design-collections/logo/logo-3.png'] as string;

// Product Data
const SHARED_COLORS = [
    { name: 'Crna', hex: '#231f20' },
    { name: 'Siva', hex: '#d1d5db' },
    { name: 'Tirkizna', hex: '#00ab98' }, // Teal
    { name: 'Cijan', hex: '#00aeef' },    // Light Blue
    { name: 'Plava', hex: '#387bbf' },    // Royal Blue
    { name: 'Ljubičasta', hex: '#8358a4' }, // Purple
    { name: 'Bijela', hex: '#ffffff' },
    { name: 'Roza', hex: '#e78fab' },     // Pink
    { name: 'Mint', hex: '#a1d7c0' }      // Light Green
];

// Design to Color Availability Map
// Maps design filename to array of allowed color hex codes
const DESIGN_COLOR_MAP: Record<string, string[]> = {
    // Street Collection
    'street-1.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'street-2.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'street-3.png': ['#231f20', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#e78fab', '#a1d7c0'], // No Grey, White
    'street-4.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#ffffff', '#e78fab', '#a1d7c0'], // No Royal Blue, Purple
    'street-5.png': ['#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'], // No Black
    'street-6.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'street-7.png': ['#231f20', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#a1d7c0'], // No Grey, Pink
    'street-8.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'street-9.png': [], // No colors available
    'street-10.png': ['#231f20', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#e78fab', '#a1d7c0'], // No Grey, White

    // Vintage Collection
    'vintage-1.png': ['#231f20', '#d1d5db', '#00ab98', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'], // No Cyan, Royal Blue
    'vintage-2.png': ['#231f20', '#d1d5db', '#00ab98', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'], // No Cyan, Royal Blue
    'vintage-3.png': ['#231f20'], // Only Black
    'vintage-4.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'vintage-5.png': ['#231f20', '#d1d5db', '#00ab98', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'], // No Cyan, Royal Blue

    // Logo Collection
    'logo-1.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'logo-3.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#ffffff', '#e78fab', '#a1d7c0'], // No Royal Blue, Purple
    'logo-4.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#ffffff', '#e78fab', '#a1d7c0'], // No Purple
    'logo-5.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'logo-6.png': ['#d1d5db', '#ffffff', '#e78fab', '#a1d7c0'], // Only Grey, White, Pink, Mint
    'logo-7.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'logo-8.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'logo-9.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'logo-10.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'logo-11.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'logo-12.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#ffffff', '#e78fab', '#a1d7c0'], // No Purple
    'KIDS-BADGE.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'STREET-BADGE.png': ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
    'VINTAGE-BADGE.png': ['#d1d5db', '#ffffff', '#e78fab', '#a1d7c0'], // Only Grey, White, Pink, Mint
};

// Helper to extract filename from design URL and get available colors
const getAvailableColorsForDesign = (designUrl: string | null): typeof SHARED_COLORS => {
    if (!designUrl) return SHARED_COLORS;

    // Use our map to get the original filename from the hashed URL
    const filename = URL_TO_FILENAME[designUrl] || designUrl.split('/').pop()?.split('?')[0] || '';

    // Check if we have a mapping for this design
    const allowedHexCodes = DESIGN_COLOR_MAP[filename];

    // If no mapping found or design has all colors, return all
    if (!allowedHexCodes || allowedHexCodes.length === 0) {
        // If explicitly empty (like street-9), return empty
        if (allowedHexCodes && allowedHexCodes.length === 0) {
            return [];
        }
        return SHARED_COLORS;
    }

    // Filter SHARED_COLORS to only include allowed ones
    return SHARED_COLORS.filter(c => allowedHexCodes.includes(c.hex));
};

const INITIAL_PRODUCTS = {
    tshirt: {
        id: 'tshirt-001',
        name: 'Dišpet T-shirt',
        price: 25.00,
        description: 'Klasična pamučna majica s vašim izborom dizajna.',
        colors: SHARED_COLORS,
        stockStatus: 'instock',
        averageRating: 0,
        ratingCount: 0,
    },
    hoodie: {
        id: 'hoodie-001',
        name: 'Dišpet Hoodie',
        price: 45.00,
        description: 'Premium teška hoodica, savršena za svaku priliku.',
        colors: SHARED_COLORS,
        stockStatus: 'instock',
        averageRating: 0,
        ratingCount: 0,
    },
    cap: {
        id: 'cap-001',
        name: 'Dišpet Cap',
        price: 20.00,
        description: 'Klasična šilterica koja upotpunjuje svaki stil.',
        colors: SHARED_COLORS,
        stockStatus: 'instock',
        averageRating: 0,
        ratingCount: 0,
    },
    bottle: {
        id: 'bottle-001',
        name: 'Dišpet termosica',
        price: 20.00,
        description: 'Termo boca od nehrđajućeg čelika.',
        colors: [
            { name: 'Crna', hex: '#231f20' },
            { name: 'Bijela', hex: '#ffffff' }
        ],
        stockStatus: 'instock',
        averageRating: 0,
        ratingCount: 0,
    }
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const Shop = () => {
    // State
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState(INITIAL_PRODUCTS);
    const [selectedProduct, setSelectedProduct] = useState<'hoodie' | 'tshirt' | 'cap' | 'bottle'>('tshirt');
    const [isCustomizing, setIsCustomizing] = useState(false);

    // Customization State
    const [selectedColor, setSelectedColor] = useState<string>(() => {
        return SHARED_COLORS[Math.floor(Math.random() * SHARED_COLORS.length)].hex;
    });
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    // Dual-zone state - Initialize empty, let Cycle sync populate it initially
    const [designs, setDesigns] = useState<{ front: string; back: string }>({ front: '', back: '' });
    const [activeZone, setActiveZone] = useState<'front' | 'back'>('front');

    const [selectedSize, setSelectedSize] = useState<string>('L');

    // UI States
    // Default to showcase mode - cycling should happen on initial load
    const [viewMode, setViewMode] = useState<'showcase' | 'customizing'>('showcase');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false); // Kept for potential mobile use

    const [isSizePickerOpen, setIsSizePickerOpen] = useState(false);
    const [expandedCollection, setExpandedCollection] = useState<string>('Logotip');
    const [activeTab, setActiveTab] = useState<'details' | 'features' | 'reviews'>('details');
    const [quantity, setQuantity] = useState(1);

    const { addToCart } = useCart();
    const { toast } = useToast();

    // Sync ViewMode and Product from URL
    useEffect(() => {
        const mode = searchParams.get('mode');
        console.log('URL mode param:', mode, '-> setting viewMode to:', mode === 'customizing' ? 'customizing' : 'showcase');
        if (mode === 'customizing') {
            if (viewMode !== 'customizing') setViewMode('customizing');
        } else {
            if (viewMode !== 'showcase') setViewMode('showcase');
        }

        const productParam = searchParams.get('product');
        if (productParam && Object.keys(INITIAL_PRODUCTS).includes(productParam as string)) {
            setSelectedProduct(productParam as any);
        }
    }, [searchParams]);

    // Auto-update color when design changes and current color is not available
    useEffect(() => {
        const currentDesignUrl = designs[activeZone];
        if (!currentDesignUrl) return;

        const availableColors = getAvailableColorsForDesign(currentDesignUrl);

        // If current color is not in available colors, switch to first available
        if (availableColors.length > 0 && !availableColors.some(c => c.hex === selectedColor)) {
            setSelectedColor(availableColors[0].hex);
        }
    }, [designs, activeZone]);


    // Fetch WP products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const wpProducts = await getProducts();
                console.log('Fetched products:', wpProducts);

                setProducts(current => {
                    const newProducts = { ...current };

                    wpProducts.forEach(wp => {
                        const lowerName = wp.name.toLowerCase();
                        let key: keyof typeof INITIAL_PRODUCTS | null = null;

                        if (lowerName.includes('hoodie') || lowerName.includes('duksica')) key = 'hoodie';
                        else if (lowerName.includes('shirt') || lowerName.includes('majica')) key = 'tshirt';
                        else if ((lowerName.includes('cap') || lowerName.includes('kapa') || lowerName.includes('šilterica')) && !lowerName.includes('bottle')) key = 'cap';
                        else if (lowerName.includes('bottle') || lowerName.includes('boca') || lowerName.includes('termosica')) key = 'bottle';

                        if (key) {
                            newProducts[key] = {
                                ...newProducts[key],
                                id: wp.id.toString(),
                                name: wp.name,
                                price: parseFloat(wp.price) || parseFloat(wp.regular_price) || 0,
                                stockStatus: wp.stock_status,
                                averageRating: parseFloat(wp.average_rating) || 0,
                                ratingCount: wp.rating_count || 0,
                            };
                        }
                    });

                    return newProducts;
                });
            } catch (error) {
                console.error('Error fetching WP products:', error);
            }
        };
        fetchProducts();
    }, []);

    // Reset defaults when product changes
    useEffect(() => {
        if (selectedProduct) {
            // REMOVE default color override to keep cycle or random previous state

            if (selectedProduct === 'cap') {
                setActiveZone('front');
            } else if (selectedProduct === 'bottle') {
                setActiveZone('front');
            } else if (selectedProduct === 'hoodie' || selectedProduct === 'tshirt') {
                setActiveZone('back');
            } else {
                setActiveZone('front');
            }
        }
    }, [selectedProduct]);

    // Listen for global reset event
    useEffect(() => {
        const handleReset = () => {
            setSearchParams({}); // Clear params to go back to showcase
            setViewMode('showcase');
            setSelectedProduct('tshirt');
            setIsCustomizing(false);
            setSelectedColor('#231f20'); // Default to new black
            setActiveZone('front');
        };

        window.addEventListener('reset-shop-view', handleReset);
        return () => window.removeEventListener('reset-shop-view', handleReset);
    }, [setSearchParams]);

    // Sync Hoodie/T-shirt Front Logo with Color
    useEffect(() => {
        if (selectedProduct === 'hoodie' || selectedProduct === 'tshirt') {
            const logo = COLOR_TO_LOGO_MAP[selectedColor];
            if (logo) {
                setDesigns(prev => ({
                    ...prev,
                    front: logo
                }));
            }
        }
    }, [selectedProduct, selectedColor]);

    // Sync viewMode and isCustomizing with URL params for Back button support
    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'customizing') {
            setViewMode('customizing');
            setIsCustomizing(true);
        } else {
            setViewMode('showcase');
            setIsCustomizing(false);
        }
    }, [searchParams]);

    // Sync changes to isFullScreen from URL (enables browser back button for fullscreen)
    useEffect(() => {
        setIsFullScreen(searchParams.get('fullscreen') === 'true');
    }, [searchParams]);

    const handleProductSelect = (product: 'hoodie' | 'tshirt' | 'cap' | 'bottle') => {
        const isSameProduct = selectedProduct === product && viewMode === 'customizing';

        setSelectedProduct(product);
        // Only reset isCustomizing if we're coming FROM showcase mode
        // If already customizing, keep it true to prevent background products from briefly showing designs
        if (viewMode !== 'customizing') {
            setIsCustomizing(false);
        }

        // Only reset interaction if we are switching products or modes
        // Clicking the SAME product in customization mode should NOT reset interaction (prevents cycle restart)
        if (!isSameProduct) {
            setHasUserInteracted(false);
        }

        // Set activeZone synchronously to avoid first-render issue
        if (product === 'hoodie' || product === 'tshirt') {
            setActiveZone('back');
        } else {
            setActiveZone('front');
        }

        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('mode', 'customizing');
            return newParams;
        }, { replace: viewMode === 'customizing' });

        setViewMode('customizing');
    };

    const handleInteraction = () => {
        if (!isCustomizing) setIsCustomizing(true);
        setHasUserInteracted(true);
    };

    // Handler to sync Cycle state to Parent state WITHOUT triggering interaction
    // This keeps the "designs" state warm with whatever is currently visible in the cycle
    // so when the user DOES interact, there's no visual jump.
    const handleCycleDesignUpdate = (newDesigns: { front: string; back: string }) => {
        // Only update if we haven't interacted yet (otherwise user changes would be overwritten)
        if (!hasUserInteracted && viewMode === 'customizing') {
            setDesigns(prev => {
                // Prevent unnecessary rerenders if identical
                if (prev.front === newDesigns.front && prev.back === newDesigns.back) return prev;
                return newDesigns;
            });
        }
    };

    const handleAddToCart = () => {
        const product = products[selectedProduct];

        // determine main image based on active zone or just front
        const mainImage = designs.front;

        addToCart({
            // @ts-ignore - Local product data doesn't perfectly match WCProduct
            id: product.id,
            name: product.name,
            price: product.price.toString(), // Convert number to string for WCProduct compliance if needed
            images: [{ id: 0, src: mainImage, alt: product.name }],
            color: selectedColor,
            size: selectedSize,
            // designs: designs 
        } as any, quantity);

        toast({
            title: "Dodano u košaricu",
            description: `${quantity}x ${product.name} (${selectedSize}) je dodan u vašu košaricu.`,
        });
    };



    const handleDesignSelect = (designUrl: string) => {
        if (selectedProduct === 'hoodie' || selectedProduct === 'tshirt') {
            // Hoodie/T-shirt Logic: Selection applies to Back. Front is managed by color sync.
            setDesigns(prev => ({
                ...prev,
                back: designUrl
                // do NOT override front here
            }));
        } else {
            setDesigns(prev => ({
                ...prev,
                [activeZone]: designUrl
            }));
        }
        handleInteraction();
    };

    const currentDesign = designs[activeZone];

    // Smart Color Selection with Design Reconciliation
    const handleColorSelect = (newHex: string) => {
        setSelectedColor(newHex);
        handleInteraction();

        // Check if current design works with new color
        const availableForCurrent = getAvailableColorsForDesign(currentDesign);
        const isCompatible = availableForCurrent.some(c => c.hex === newHex);

        if (!isCompatible) {
            // Design clash! Find a better design in the CURRENT collection
            // 1. Identify current collection
            let currentCollectionName = expandedCollection;

            // Fallback: If expandedCollection is null (intro mode), try to guess or default
            if (!currentCollectionName) {
                // Heuristic: check where current design exists
                if (DESIGN_COLLECTIONS['Ulična Moda'].includes(currentDesign)) currentCollectionName = 'Ulična Moda';
                else if (DESIGN_COLLECTIONS['Vintage Stil'].includes(currentDesign)) currentCollectionName = 'Vintage Stil';
                else currentCollectionName = 'Logotip';
            }

            const collectionDesigns = DESIGN_COLLECTIONS[currentCollectionName] || [];

            // 2. Find first design in this collection that SUPPORTS the new color
            const compatibleDesign = collectionDesigns.find(d => {
                // Check restrictions first
                const filename = URL_TO_FILENAME[d] || d.split('/').pop()?.split('?')[0] || '';
                const restricted = PRODUCT_RESTRICTED_DESIGNS[selectedProduct];
                if (restricted && restricted.includes(filename)) return false;

                const allowed = getAvailableColorsForDesign(d);
                return allowed.some(c => c.hex === newHex);
            });

            if (compatibleDesign) {
                // Switch to the compatible design
                if (selectedProduct === 'hoodie' || selectedProduct === 'tshirt') {
                    setDesigns(prev => ({ ...prev, back: compatibleDesign }));
                } else {
                    setDesigns(prev => ({ ...prev, [activeZone]: compatibleDesign }));
                }
            }
        }
    };

    const PRODUCT_KEYS: ('hoodie' | 'tshirt' | 'cap' | 'bottle')[] = ['hoodie', 'tshirt', 'cap', 'bottle'];

    const cycleProduct = (direction: 'next' | 'prev') => {
        const currentIndex = PRODUCT_KEYS.indexOf(selectedProduct);
        let newIndex;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % PRODUCT_KEYS.length;
        } else {
            newIndex = (currentIndex - 1 + PRODUCT_KEYS.length) % PRODUCT_KEYS.length;
        }
        handleProductSelect(PRODUCT_KEYS[newIndex]);
    };

    const activeProductData = products[selectedProduct];

    return (
        <div className="min-h-screen bg-white">
            {/* 1. Header Section (Carousel) */}
            <motion.div
                layout
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`w-full bg-gradient-to-br from-[#00ffbf] to-[#0089cd] overflow-hidden ${isFullScreen ? 'fixed inset-0 z-[100] h-screen' : 'relative h-[92vh] md:h-[85vh]'}`}
            >

                {/* Navigation Arrows */}
                {viewMode === 'customizing' && !isFullScreen && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-50 flex justify-between px-4 md:px-8 pointer-events-none">
                        <button
                            onClick={() => cycleProduct('prev')}
                            className="pointer-events-auto w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all hover:scale-110 shadow-lg"
                        >
                            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
                        </button>
                        <button
                            onClick={() => cycleProduct('next')}
                            className="pointer-events-auto w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all hover:scale-110 shadow-lg"
                        >
                            <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
                        </button>
                    </div>
                )}

                {/* 3D Scene Background */}
                <div className="absolute inset-0 z-40 pointer-events-none">
                    <div className="w-full h-full pointer-events-auto relative">
                        <ShopScene
                            onSelectProduct={handleProductSelect}
                            selectedProduct={selectedProduct}
                            isCustomizing={isCustomizing}
                            selectedColor={selectedColor}
                            designs={designs}
                            activeZone={activeZone}
                            mode={viewMode}
                            isFullscreen={isFullScreen}
                            products={products}
                            colorToLogoMap={COLOR_TO_LOGO_MAP}
                            hasUserInteracted={hasUserInteracted}
                            logoList={DESIGN_COLLECTIONS['Logotip']}
                            hoodieBackList={useMemo(() => [
                                ...DESIGN_COLLECTIONS['Ulična Moda']
                            ], [])}
                            vintageList={useMemo(() => [
                                ...DESIGN_COLLECTIONS['Vintage Stil']
                            ], [])}
                            allDesignsList={useMemo(() => [
                                ...DESIGN_COLLECTIONS['Logotip'],
                                ...DESIGN_COLLECTIONS['Ulična Moda'],
                                ...DESIGN_COLLECTIONS['Vintage Stil']
                            ], [])}
                            onCycleDesignUpdate={handleCycleDesignUpdate}
                        />

                    </div>
                </div>



                {/* Overlay Text (Title & Price) */}
                {viewMode === 'customizing' && (
                    <div className="absolute inset-0 z-20 pointer-events-none container mx-auto px-6 md:px-8">
                        <div className="relative w-full h-full flex flex-col justify-between pt-20 md:pt-28 pb-48">
                            {/* Top Area titles */}
                            <div className="flex justify-between items-start w-full">
                                <motion.h2
                                    key={`title-${selectedProduct}`}
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-3xl md:text-5xl font-black text-white drop-shadow-lg tracking-tight font-['DynaPuff'] w-[40%] leading-[0.9] md:leading-tight text-left break-words"
                                >
                                    {activeProductData.name}
                                </motion.h2>

                                <motion.div
                                    key={`price-${selectedProduct}`}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-3xl md:text-5xl font-black text-white tracking-widest drop-shadow-md font-['DynaPuff'] text-right"
                                >
                                    {activeProductData.price.toFixed(2)}€
                                </motion.div>
                            </div>
                        </div>
                    </div>
                )}

                {/* FLOATING CONTROLS - z-50 to be on top of everything */}

                {/* 3. Central Controls (Bottom Center) */}
                {viewMode === 'customizing' && (
                    <div className="absolute bottom-4 left-0 right-0 z-50 flex flex-col items-center justify-end pointer-events-none">
                        <div className="pointer-events-auto w-full max-w-4xl px-4 flex flex-col items-center gap-4">

                            {/* ZONE SELECTOR (Only for Hoodie) - REMOVED DESKTOP PILLS TO UNIFY WITH MOBILE STYLE */}


                            {/* 1. Color Picker (Top) - Style matched to Design Bar */}
                            {selectedProduct !== 'cap' && (() => {
                                const designColors = getAvailableColorsForDesign(currentDesign);
                                const productColors = activeProductData.colors || SHARED_COLORS;

                                // Intersect: Only show colors that are BOTH in design rules AND product rules
                                const availableColors = designColors.filter(dc =>
                                    productColors.some(pc => pc.hex === dc.hex)
                                );

                                return availableColors.length > 0 ? (
                                    <div className="flex gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-full border border-white/10 shadow-2xl mb-1">
                                        {availableColors.map((c) => (
                                            <button
                                                key={c.name}
                                                onClick={() => handleColorSelect(c.hex)}
                                                className={`w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/20 transition-transform hover:scale-110 ${selectedColor === c.hex
                                                    ? 'ring-2 ring-white scale-110 shadow-md'
                                                    : 'opacity-80 hover:opacity-100'
                                                    }`}
                                                style={{ backgroundColor: c.hex }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                ) : null;
                            })()}

                            {/* 2. Collection Toggles (Tabs) with side buttons */}
                            <div className="flex items-center justify-center gap-2 md:gap-4 w-full">
                                {/* Zone Toggle - Left side, icon only, visible on all screens */}
                                {(selectedProduct === 'hoodie' || selectedProduct === 'tshirt') && (
                                    <button
                                        onClick={() => setActiveZone(activeZone === 'front' ? 'back' : 'front')}
                                        className="bg-black/80 hover:bg-black backdrop-blur-md p-2.5 rounded-full text-white transition-all shadow-lg border border-white/10 group pointer-events-auto"
                                        title={activeZone === 'front' ? 'Switch to Back' : 'Switch to Front'}
                                    >
                                        <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                    </button>
                                )}

                                <div className="flex justify-center md:gap-4 bg-black/80 backdrop-blur-md p-1.5 rounded-full shadow-xl border border-white/10 w-fit max-w-[60vw] md:max-w-none overflow-x-auto custom-scrollbar">
                                    {['Ulična Moda', 'Logotip', 'Vintage Stil']
                                        .map(name => (
                                            <button
                                                key={name}
                                                onClick={() => setExpandedCollection(name)}
                                                className={`px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] md:tracking-widest whitespace-nowrap transition-all font-['DynaPuff'] ${expandedCollection === name
                                                    ? 'bg-white text-black shadow-md'
                                                    : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                                            >
                                                {name.replace('Ulična Moda', 'Street').replace('Vintage Stil', 'Vintage').replace('Logotip', 'Logo')}
                                            </button>
                                        ))}
                                </div>



                                {/* Expand Button - Right side, icon only, visible on all screens */}
                                <button
                                    onClick={() => {
                                        const isFs = !isFullScreen;
                                        setSearchParams(prev => {
                                            const newParams = new URLSearchParams(prev);
                                            if (isFs) newParams.set('fullscreen', 'true');
                                            else newParams.delete('fullscreen');
                                            return newParams;
                                        });
                                    }}
                                    className="bg-black/80 hover:bg-black backdrop-blur-md p-2.5 rounded-full text-white transition-all shadow-lg border border-white/10 group pointer-events-auto"
                                    title={isFullScreen ? "Close Fullscreen" : "Expand 3D View"}
                                >
                                    {isFullScreen ? (
                                        <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    ) : (
                                        <Box className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    )}
                                </button>
                            </div>

                            {/* 3. Design Thumbnails (Bottom - Large Single Row) */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={expandedCollection}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex justify-start flex-nowrap gap-2 p-2 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-x-auto w-full max-w-full custom-scrollbar touch-pan-x"
                                >
                                    {DESIGN_COLLECTIONS[expandedCollection]
                                        .filter(design => {
                                            const filename = URL_TO_FILENAME[design] || design.split('/').pop()?.split('?')[0] || '';
                                            const restricted = PRODUCT_RESTRICTED_DESIGNS[selectedProduct];
                                            if (restricted && restricted.includes(filename)) return false;
                                            return true;
                                        })
                                        .map((design, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleDesignSelect(design)}
                                                className={`w-20 h-20 md:w-28 md:h-28 flex-shrink-0 rounded-lg border-2 overflow-hidden bg-white transition-all transform hover:scale-105 ${currentDesign === design
                                                    ? 'border-black ring-2 ring-white scale-105 shadow-xl'
                                                    : 'border-transparent opacity-90 hover:opacity-100'
                                                    }`}
                                            >
                                                <img
                                                    src={design}
                                                    alt="Design"
                                                    className="w-full h-full object-contain p-2"
                                                />
                                            </button>
                                        ))}
                                </motion.div>
                            </AnimatePresence>


                        </div>
                    </div>
                )}

                {/* Desktop Expand/Collapse Button - REMOVED to unify with mobile style in control bar */}


                {/* Cloud Separator */}
                <img
                    src={cloudsTopSvg}
                    alt=""
                    className="absolute bottom-0 left-0 min-w-[101%] w-[101%] -ml-[1px] h-auto z-30 pointer-events-none"
                />
            </motion.div>

            {/* Placeholder to prevent layout shift when header becomes fixed */}
            {isFullScreen && <div className="h-[92vh] md:h-[85vh]" />}

            {viewMode === 'showcase' ? (
                <div className="w-full relative z-40 bg-white -mt-2 pt-12 md:pt-24">

                    {/* Banner Image */}
                    <div className="w-full h-auto">
                        <img
                            src={bannerImage}
                            alt="Shop Banner"
                            className="w-full h-full object-cover block"
                        />
                    </div>

                    <div className="container mx-auto px-4 py-8 md:py-16 relative z-50 text-center pointer-events-none">
                        <h2 className="text-4xl md:text-6xl font-black text-[#43bfe6] font-['DynaPuff'] tracking-wide mb-6 drop-shadow-sm">
                            Izaberi artikal i pronađi svoj stil
                        </h2>
                        <p className="text-xl md:text-2xl font-medium text-gray-600 max-w-4xl mx-auto leading-relaxed">
                            Sav prihod od prodaje ide organizaciji Dišpeta, dana zabave i sporta za djecu i odrasle.
                        </p>
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
                </div>
            ) : (
                <div className="container mx-auto px-4 py-12 md:py-20 bg-gray-50 -mt-10 relative z-40 rounded-[3rem] shadow-2xl">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* 1. Top Section: Controls (Size + Quantity + Cart) */}
                        <div className="flex flex-col xl:flex-row items-stretch xl:items-end gap-6 my-8">

                            {/* Controls Wrapper */}
                            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto shrink-0 justify-center">

                                {/* Size Picker */}
                                {selectedProduct !== 'cap' && selectedProduct !== 'bottle' && (
                                    <div className="flex-1 sm:flex-none flex flex-col gap-3 min-w-[200px]">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-sm font-bold uppercase tracking-wider text-gray-400 font-['DynaPuff']">Veličina</label>
                                        </div>
                                        <div className="flex justify-center items-center gap-2 p-1.5 bg-white rounded-full border border-gray-100 shadow-sm h-[62px]">
                                            {['S', 'M', 'L', 'XL'].map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`w-10 h-10 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center font-['DynaPuff'] ${selectedSize === size
                                                        ? 'bg-black text-white shadow-md scale-100'
                                                        : 'text-gray-500 hover:bg-gray-50 hover:text-black hover:scale-110'
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Picker */}
                                <div className="flex-1 sm:flex-none flex flex-col gap-3 min-w-[140px]">
                                    <label className="text-sm font-bold uppercase tracking-wider text-gray-400 px-1 font-['DynaPuff']">Količina</label>
                                    <div className="flex items-center justify-between gap-1 bg-white rounded-full border border-gray-100 shadow-sm p-1.5 h-[62px] sm:h-[62px]">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-12 h-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition-all active:scale-95"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </button>
                                        <span className="flex-1 text-center font-black text-xl text-gray-900 font-['DynaPuff']">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-12 h-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition-all active:scale-95"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Add to Cart Button */}
                            <div className="flex-1 w-full min-w-[280px] group/btn">
                                <Button
                                    size="lg"
                                    disabled={activeProductData.stockStatus === 'outofstock'}
                                    className={`w-full h-[62px] text-xl font-bold rounded-full transition-all flex items-center justify-center gap-3 relative overflow-hidden font-['DynaPuff'] border-2 border-transparent shadow-none ${activeProductData.stockStatus === 'outofstock'
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                        : 'text-white'}`}
                                    style={activeProductData.stockStatus !== 'outofstock' ? {
                                        background: `
                                            linear-gradient(135deg, #00ffbf, #0089cd) padding-box,
                                            conic-gradient(from var(--border-angle, 0deg), #ad00e9 0%, transparent 10%, transparent 90%, #ad00e9 100%) border-box
                                        `,
                                        transition: '--border-angle 0.15s ease'
                                    } : undefined}
                                    onMouseMove={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = e.clientX - rect.left - rect.width / 2;
                                        const y = e.clientY - rect.top - rect.height / 2;
                                        const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
                                        e.currentTarget.style.setProperty('--border-angle', `${angle}deg`);
                                    }}
                                    onClick={handleAddToCart}
                                >
                                    {activeProductData.stockStatus === 'outofstock' ? (
                                        <span>Nema na zalihi</span>
                                    ) : (
                                        <>
                                            <ShoppingBag className="w-6 h-6 transition-transform group-hover/btn:rotate-12" />
                                            <span>Dodaj u košaricu</span>
                                            <div className="w-px h-6 bg-white/20 mx-2" />
                                            <span className="tabular-nums">{(activeProductData.price * quantity).toFixed(2)}€</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* 2. Bottom Section: Tabs */}
                        <div className="rounded-3xl overflow-hidden min-h-[400px]">
                            {/* Tab Headers */}
                            <div className="flex border-b border-gray-200/50 overflow-x-auto bg-white/50 backdrop-blur-sm rounded-t-3xl">
                                {[
                                    { id: 'details', label: 'Detalji' },
                                    { id: 'features', label: 'Značajke' },
                                    { id: 'reviews', label: `Recenzije (${activeProductData.ratingCount})` }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 py-4 px-2 md:px-8 text-sm md:text-lg font-bold font-heading transition-colors whitespace-nowrap ${activeTab === tab.id
                                            ? 'text-[#e83e70] border-b-4 border-[#e83e70] bg-[#e83e70]/10'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-b-3xl">
                                {activeTab === 'details' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h3 className="text-3xl font-black font-heading mb-6 text-gray-900">{activeProductData.name}</h3>
                                        <p className="text-gray-600 leading-relaxed text-lg mb-8">
                                            {activeProductData.description || "Vrhunska kvaliteta i udobnost. Naši proizvodi izrađeni su od najfinijih materijala, pružajući savršen balans između stila i funkcionalnosti. Idealno za svakodnevno nošenje ili posebne prilike."}
                                        </p>

                                        {selectedProduct === 'bottle' ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                                    <div className="text-[#e83e70] font-black text-2xl mb-1">500ml</div>
                                                    <div className="text-gray-500 text-xs font-bold uppercase">Kapacitet</div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                                    <div className="text-[#43bfe6] font-black text-2xl mb-1">Inox</div>
                                                    <div className="text-gray-500 text-xs font-bold uppercase">Materijal</div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                                    <div className="text-[#ad00e9] font-black text-2xl mb-1">12h/24h</div>
                                                    <div className="text-gray-500 text-xs font-bold uppercase">Toplo/Hladno</div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                                    <div className="text-green-500 font-black text-2xl mb-1">283g</div>
                                                    <div className="text-gray-500 text-xs font-bold uppercase">Težina</div>
                                                </div>
                                            </div>
                                        ) : (selectedProduct === 'hoodie' || selectedProduct === 'tshirt') ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                                    <div className="text-[#e83e70] font-black text-2xl mb-1">100%</div>
                                                    <div className="text-gray-500 text-xs font-bold uppercase">Pamuk</div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                                    <div className="text-[#43bfe6] font-black text-2xl mb-1">2%</div>
                                                    <div className="text-gray-500 text-xs font-bold uppercase">Skupljanje</div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                                    <div className="text-[#ad00e9] font-black text-2xl mb-1">40°C</div>
                                                    <div className="text-gray-500 text-xs font-bold uppercase">Pranje</div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                                    <div className="text-green-500 font-black text-2xl mb-1">HR</div>
                                                    <div className="text-gray-500 text-xs font-bold uppercase">Proizvodnja</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                                    <div className="text-[#e83e70] font-black text-2xl mb-1">100%</div>
                                                    <div className="text-gray-500 text-xs font-bold uppercase">Poliester</div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                                    <div className="text-[#43bfe6] font-black text-2xl mb-1">DTF</div>
                                                    <div className="text-gray-500 text-xs font-bold uppercase">Print</div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                                    <div className="text-[#ad00e9] font-black text-2xl mb-1">EU</div>
                                                    <div className="text-gray-500 text-xs font-bold uppercase">Kvaliteta</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'features' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid md:grid-cols-2 gap-8">
                                        {selectedProduct === 'bottle' ? (
                                            <ul className="space-y-4">
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Nepropusno (Leakproof)</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Toplinska izolacija: 12h</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Hladna izolacija: 24h</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Dvostruka stijenka s bakrenom izolacijom</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Dimenzije: ø70×263 mm</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-400 shrink-0">
                                                        <X className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Nije za mikrovalnu</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-400 shrink-0">
                                                        <X className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Nije za perilicu posuđa</span>
                                                </li>
                                            </ul>
                                        ) : (selectedProduct === 'hoodie' || selectedProduct === 'tshirt') ? (
                                            <ul className="space-y-4">
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Sastav: 100% Pamuk</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Skupljanje: po visini 2%, po dužini 2%</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Održavanje: Pranje na 40°C, Glačanje</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Proizvođač: Tina-co Solin d.o.o.</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Stavlja na tržište: 021 d.o.o.</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Tehnika tiska: DTF</span>
                                                </li>
                                            </ul>
                                        ) : (
                                            <ul className="space-y-4">
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">100% Poliester</span>
                                                </li>
                                                <li className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                        <Check className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 text-lg">Tehnika tiska: DTF</span>
                                                </li>
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'reviews' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                        {activeProductData.ratingCount > 0 ? (
                                            <>
                                                <div className="flex items-center gap-4 mb-8 p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                                                    <div className="text-5xl font-black text-yellow-500">{activeProductData.averageRating.toFixed(1)}</div>
                                                    <div>
                                                        <div className="flex text-yellow-500 mb-1">
                                                            {[1, 2, 3, 4, 5].map(i => (
                                                                <Star
                                                                    key={i}
                                                                    className={`w-5 h-5 ${i <= Math.round(activeProductData.averageRating) ? 'fill-current' : 'text-gray-300'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="text-gray-600 font-medium">Temeljeno na {activeProductData.ratingCount} recenzija</div>
                                                    </div>
                                                </div>

                                                {/* Sample Review - kept static for now as actual review text isn't fetched yet */}
                                                <div className="border-b border-gray-100 pb-6">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-bold text-gray-900">Marko P.</div>
                                                        <span className="text-sm text-gray-400">Prije 2 dana</span>
                                                    </div>
                                                    <div className="flex text-yellow-400 mb-2">
                                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="fill-current w-4 h-4" />)}
                                                    </div>
                                                    <p className="text-gray-600">"Vrhunska hoodica, print je jasan i boje su žive. Dostava je bila super brza!"</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="flex justify-center mb-4">
                                                    <Star className="w-12 h-12 text-gray-300" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">Još nema recenzija</h3>
                                                <p className="text-gray-500">
                                                    Budite prvi koji će recenzirati “{activeProductData.name}”
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shop;
