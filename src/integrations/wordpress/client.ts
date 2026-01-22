export const WP_API_URL = import.meta.env.VITE_WP_API_URL || 'https://wp.dispet.fun/wp-json';

export const wpFetch = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${WP_API_URL}${endpoint}`;

    // Add timestamp to query params to bust cache for GET requests
    const finalUrl = options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE'
        ? url
        : `${url}${url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;

    const response = await fetch(finalUrl, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            // 'Cache-Control': 'no-cache' is generally allowed, but removing strict ones to fix CORS
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`WP Error [${response.status}]:`, errorText);
        throw new Error(`WordPress API Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
    }

    return response.json();
};

// Basic Auth helper for WooCommerce (requires HTTPS) or WP Application Passwords
export const getAuthHeaders = () => {
    // Priority 1: WordPress Application Password (ENV or LocalStorage)
    const wpUser = import.meta.env.VITE_WP_USERNAME || localStorage.getItem('wp_username');
    const wpPass = import.meta.env.VITE_WP_APP_PASSWORD || localStorage.getItem('wp_app_password');

    if (wpUser && wpPass) {
        // Safe encoding for special characters (like 'š')
        const hash = btoa(unescape(encodeURIComponent(`${wpUser}:${wpPass}`)));
        return {
            Authorization: `Basic ${hash}`,
        };
    }

    // Priority 2: WooCommerce Consumer Keys (Fallback, mostly for WC endpoints)
    const key = import.meta.env.VITE_WC_CONSUMER_KEY;
    const secret = import.meta.env.VITE_WC_CONSUMER_SECRET;

    if (!key || !secret) {
        console.warn('WordPress/WooCommerce credentials missing');
        return {};
    }

    const hash = btoa(`${key}:${secret}`);
    return {
        Authorization: `Basic ${hash}`,
    };
};
