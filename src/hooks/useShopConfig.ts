import { useState, useEffect, useCallback } from 'react';

const WP_API_URL = '/wp-json'; // Uses Vite proxy in development

// Default fallback configuration (matches PHP defaults)
const DEFAULT_CONFIG: ShopConfig = {
    tshirt: {
        allowed_colors: ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
        default_zone: 'back',
        locked_zone: 'front',
        restricted_designs: [],
        has_front_back: true
    },
    hoodie: {
        allowed_colors: ['#231f20', '#d1d5db', '#00ab98', '#00aeef', '#387bbf', '#8358a4', '#ffffff', '#e78fab', '#a1d7c0'],
        default_zone: 'back',
        locked_zone: 'front',
        restricted_designs: [],
        has_front_back: true
    },
    cap: {
        allowed_colors: ['#231f20'],
        default_zone: 'front',
        locked_zone: null,
        restricted_designs: ['street-5.png'],
        has_front_back: false
    },
    bottle: {
        allowed_colors: ['#231f20', '#ffffff'],
        default_zone: 'front',
        locked_zone: null,
        restricted_designs: [],
        has_front_back: false
    },
    alternatives: [
        {
            design_id: 'street-3.png',
            trigger_colors: ['#e78fab', '#a1d7c0', '#00aeef'],
            replace_with: 'street-3-alt.png'
        }
    ],
    design_color_map: {}
};

export interface ProductConfig {
    allowed_colors: string[];
    default_zone: 'front' | 'back';
    locked_zone: 'front' | 'back' | null;
    restricted_designs: string[];
    has_front_back: boolean;
}

export interface AlternativeRule {
    design_id: string;
    trigger_colors: string[];
    replace_with: string;
}

export interface ShopConfig {
    tshirt: ProductConfig;
    hoodie: ProductConfig;
    cap: ProductConfig;
    bottle: ProductConfig;
    alternatives: AlternativeRule[];
    design_color_map: Record<string, string[]>;
}

interface UseShopConfigReturn {
    config: ShopConfig;
    loading: boolean;
    error: string | null;
    refetch: () => void;
    getProductConfig: (productId: string) => ProductConfig;
    getAllowedColors: (productId: string) => string[];
    getAlternativeDesign: (designFilename: string, currentColor: string) => string | null;
    isDesignRestricted: (productId: string, designFilename: string) => boolean;
    isColorAllowed: (productId: string, colorHex: string) => boolean;
}

export function useShopConfig(): UseShopConfigReturn {
    const [config, setConfig] = useState<ShopConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${WP_API_URL}/antigravity/v1/shop-config`);
            if (!res.ok) throw new Error('Failed to fetch shop config');
            const data = await res.json();
            setConfig(data);
        } catch (err: any) {
            console.error('useShopConfig: Failed to fetch, using defaults', err);
            setError(err.message || 'Unknown error');
            // Keep using DEFAULT_CONFIG as fallback
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // Helper: Get product config
    const getProductConfig = useCallback((productId: string): ProductConfig => {
        const key = productId as keyof Pick<ShopConfig, 'tshirt' | 'hoodie' | 'cap' | 'bottle'>;
        return config[key] || DEFAULT_CONFIG.tshirt;
    }, [config]);

    // Helper: Get allowed colors for a product
    const getAllowedColors = useCallback((productId: string): string[] => {
        return getProductConfig(productId).allowed_colors;
    }, [getProductConfig]);

    // Helper: Check if a design should be substituted
    const getAlternativeDesign = useCallback((designFilename: string, currentColor: string): string | null => {
        const alt = config.alternatives.find(a =>
            a.design_id === designFilename &&
            a.trigger_colors.includes(currentColor.toLowerCase())
        );
        return alt ? alt.replace_with : null;
    }, [config.alternatives]);

    // Helper: Check if design is restricted for product
    const isDesignRestricted = useCallback((productId: string, designFilename: string): boolean => {
        const productConfig = getProductConfig(productId);
        return productConfig.restricted_designs.includes(designFilename);
    }, [getProductConfig]);

    // Helper: Check if color is allowed for product
    const isColorAllowed = useCallback((productId: string, colorHex: string): boolean => {
        const productConfig = getProductConfig(productId);
        return productConfig.allowed_colors.includes(colorHex.toLowerCase());
    }, [getProductConfig]);

    return {
        config,
        loading,
        error,
        refetch: fetchConfig,
        getProductConfig,
        getAllowedColors,
        getAlternativeDesign,
        isDesignRestricted,
        isColorAllowed
    };
}
