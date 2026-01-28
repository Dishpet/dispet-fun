// In development, we talk to the local proxy. In production, relative path /api handled by Nginx/Node.
export const WP_API_URL = import.meta.env.DEV ? 'http://localhost:3000/api' : '/api';

export const wpFetch = async (endpoint: string, options: RequestInit = {}) => {
    // Endpoints in the secure proxy mirror the WP structure but under /api/wc/...
    // The previous code mapped /wc/v3/products -> http://localhost:3000/api/wc/products
    const url = `${WP_API_URL}${endpoint}`;

    // Add timestamp to query params to bust cache for GET requests
    const finalUrl = options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE'
        ? url
        : `${url}${url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;

    const response = await fetch(finalUrl, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error [${response.status}]:`, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
};

export const getAuthHeaders = () => {
    // The PROXY server handles Admin/Store authentication now.
    // We only need to pass headers if we are acting as a specific logged-in USER (Customer).

    const token = localStorage.getItem('token');
    if (token) {
        return {
            Authorization: `Bearer ${token}`
        };
    }

    return {};
};
