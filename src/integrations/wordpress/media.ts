import { getAuthHeaders, WP_API_URL } from './client';
import { WPMedia } from './types';

export const getMedia = async (page = 1, perPage = 20): Promise<{ data: WPMedia[], totalPages: number }> => {
    const url = `${WP_API_URL}/wp/v2/media?page=${page}&per_page=${perPage}`;
    // Use raw fetch to get headers
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            // Include auth headers if available/needed. 
            // Previous code didn't use them for GET, but let's be consistent if we want private media.
            ...getAuthHeaders() as any,
        }
    });

    if (!response.ok) {
        throw new Error(`WordPress API Error: ${response.statusText}`);
    }

    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);
    const data = await response.json();

    return { data, totalPages };
};

export const uploadMedia = async (file: File): Promise<WPMedia> => {
    const headers = getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);

    const url = `${WP_API_URL}/wp/v2/media`;

    // Authorization header needs to be passed explicity
    const authHeader = (headers as any).Authorization;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'Content-Disposition': `attachment; filename="${file.name}"`,
            // Let browser set Content-Type for FormData
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Media Upload Error: ${response.statusText}`);
    }

    return response.json();
};
