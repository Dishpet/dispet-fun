import { wpFetch, getAuthHeaders } from './client';
import { WCProduct } from './types';

export const getProduct = async (id: number): Promise<WCProduct> => {
    return await wpFetch(`/wc/v3/products/${id}`);
};

export const getProducts = async (page = 1, perPage = 20): Promise<WCProduct[]> => {
    const headers = getAuthHeaders();
    return wpFetch(`/wc/v3/products?page=${page}&per_page=${perPage}`, { headers });
};

export const getProductBySlug = async (slug: string): Promise<WCProduct | null> => {
    const headers = getAuthHeaders();
    const products = await wpFetch(`/wc/v3/products?slug=${slug}`, { headers });
    return products.length > 0 ? products[0] : null;
};

import { WCOrder } from './types';

export const createOrder = async (orderData: any) => {
    const headers = getAuthHeaders();
    return wpFetch('/wc/v3/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
    });
};

export const getOrders = async (customerId?: number): Promise<WCOrder[]> => {
    const headers = getAuthHeaders();
    const query = customerId ? `?customer=${customerId}` : '';
    return wpFetch(`/wc/v3/orders${query}`, { headers });
};

export const createCustomer = async (customerData: any) => {
    const headers = getAuthHeaders();
    return wpFetch('/wc/v3/customers', {
        method: 'POST',
        headers,
        body: JSON.stringify(customerData),
    });
};

export const getReports = async (period: 'week' | 'month' | 'last_month' | 'year' = 'month') => {
    const headers = getAuthHeaders();
    return wpFetch(`/wc/v3/reports/sales?period=${period}`, { headers });
};

export const getCustomers = async (page = 1, perPage = 20) => {
    const headers = getAuthHeaders();
    return wpFetch(`/wc/v3/customers?page=${page}&per_page=${perPage}`, { headers });
};

export const createProduct = async (data: any): Promise<WCProduct> => {
    const headers = getAuthHeaders();
    return wpFetch('/wc/v3/products', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
};

export const updateProduct = async (id: number, data: any): Promise<WCProduct> => {
    const headers = getAuthHeaders();
    return wpFetch(`/wc/v3/products/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    });
};

export const getProductVariations = async (productId: number): Promise<any[]> => {
    const headers = getAuthHeaders();
    return wpFetch(`/wc/v3/products/${productId}/variations?per_page=100`, { headers });
};

export const updateProductVariation = async (productId: number, variationId: number, data: any): Promise<any> => {
    const headers = getAuthHeaders();
    return wpFetch(`/wc/v3/products/${productId}/variations/${variationId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    });
};
export const getCustomer = async (id: number) => {
    const headers = getAuthHeaders();
    return wpFetch(`/wc/v3/customers/${id}`, { headers });
};

export const verifyCredentials = async (username: string, password: string) => {
    // Basic Auth for standard WP User verification
    // Not using getAuthHeaders() because we want to test the *provided* credentials, not the admin ones
    // context=edit returns roles and capabilities
    const hash = btoa(unescape(encodeURIComponent(`${username}:${password}`)));
    return wpFetch('/wp/v2/users/me?context=edit', {
        headers: {
            Authorization: `Basic ${hash}`,
        }
    });
};

export const executeHeadlessPayment = async (orderData: any, stripeToken: string) => {
    const headers = getAuthHeaders();
    return wpFetch('/antigravity/v1/checkout-payment', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            order_data: orderData,
            stripe_token: stripeToken
        }),
    });
};


export const syncGoogleUserToWP = async (googleUser: any) => {
    const headers = getAuthHeaders();

    // 1. Check if user exists by Email
    const existing = await wpFetch(`/wc/v3/customers?email=${googleUser.email}`, { headers });

    if (existing && existing.length > 0) {
        return existing[0];
    }

    // 2. Create new user if not exists
    // We set a random strong password since they use Google Login
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "!";

    const newCustomer = {
        email: googleUser.email,
        first_name: googleUser.first_name,
        last_name: googleUser.last_name,
        username: googleUser.email.split('@')[0], // Generate username from email
        password: randomPassword,
        billing: {
            first_name: googleUser.first_name,
            last_name: googleUser.last_name,
            email: googleUser.email
        },
        shipping: {
            first_name: googleUser.first_name,
            last_name: googleUser.last_name
        }
    };

    return createCustomer(newCustomer);
};

export const sendOrderNotification = async (notificationData: any) => {
    // No auth needed as permission_callback is __return_true, but using wpFetch for consistency
    const headers = getAuthHeaders();
    return wpFetch('/antigravity/v1/order-notification', {
        method: 'POST',
        headers,
        body: JSON.stringify(notificationData)
    });
};
