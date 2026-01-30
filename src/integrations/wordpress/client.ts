// In development/production, use /api which is proxied by Vite (dev) or server.js (prod)
export const WP_API_URL = '/api';

export const wpFetch = async (endpoint: string, options: RequestInit = {}) => {
    // Endpoints should not include /api here if they are relative to WP_API_URL
    // But existing calls probably pass /wc/v3/...

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
        Authorization: `Basic ${token}`
    }

    return {};
};
