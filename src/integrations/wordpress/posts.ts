import { wpFetch, getAuthHeaders } from './client';
import { WPPost } from './types';

export const getPosts = async (page = 1, perPage = 10): Promise<WPPost[]> => {
    return wpFetch(`/wp/v2/posts?page=${page}&per_page=${perPage}&_embed`);
};

export const getPostBySlug = async (slug: string, useAuth = false): Promise<WPPost | null> => {
    const headers = useAuth ? getAuthHeaders() : {};
    const statusParam = useAuth ? '&status=publish,private,draft' : '';
    const posts = await wpFetch(`/wp/v2/posts?slug=${slug}&_embed${statusParam}`, { headers });
    return posts.length > 0 ? posts[0] : null;
};

export const createPost = async (data: any): Promise<WPPost> => {
    return wpFetch('/wp/v2/posts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
};

export const updatePost = async (id: number, data: any): Promise<WPPost> => {
    return wpFetch(`/wp/v2/posts/${id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
};

export const deletePost = async (id: number): Promise<WPPost> => {
    return wpFetch(`/wp/v2/posts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
};
