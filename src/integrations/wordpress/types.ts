export interface WPPost {
    id: number;
    date: string;
    slug: string;
    title: { rendered: string };
    content: { rendered: string };
    excerpt: { rendered: string };
    featured_media: number;
    _embedded?: {
        'wp:featuredmedia'?: Array<{ source_url: string }>;
    };
}

export interface WCProduct {
    id: number;
    name: string;
    slug: string;
    permalink: string;
    price: string;
    regular_price: string;
    sale_price: string;
    description: string;
    short_description: string;
    images: Array<{ id: number; src: string; alt: string }>;
    categories: Array<{ id: number; name: string; slug: string }>;
    stock_status: 'instock' | 'outofstock' | 'onbackorder';
    average_rating: string;
    rating_count: number;
}

export interface WCCustomer {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    billing: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        address_1: string;
        city: string;
        postcode: string;
        country: string;
    };
}

export interface WCOrder {
    id: number;
    status: string;
    total: string;
    currency: string;
    date_created: string;
    line_items: Array<{
        id: number;
        name: string;
        product_id: number;
        quantity: number;
        total: string;
    }>;
}

export interface WPMedia {
    id: number;
    date: string;
    slug: string;
    source_url: string;
    title: { rendered: string };
    media_details: {
        width: number;
        height: number;
        sizes: {
            thumbnail?: { source_url: string };
            medium?: { source_url: string };
            full?: { source_url: string };
        };
    };
}

