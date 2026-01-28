import { getAuthHeaders, WP_API_URL } from './client';
import { WPMedia } from './types';

export const getMedia = async (page = 1, perPage = 20): Promise<{ data: WPMedia[], totalPages: number }> => {
    const url = `/wp/v2/media?page=${page}&per_page=${perPage}`;

    // We use a custom fetch here because we need to access response headers for pagination
    const response = await fetch(`${WP_API_URL}${url}`, {
        headers: {
            ...getAuthHeaders() as any,
        }
    });

    if (!response.ok) {
        throw new Error(`WordPress API Error: ${response.statusText}`);
    }

    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
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
            'Content-Type': file.type,
        },
        body: file
    });

    if (!response.ok) {
        throw new Error(`Media Upload Error: ${response.statusText}`);
    }

    return response.json();
};
