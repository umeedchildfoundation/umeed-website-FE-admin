/**
 * Storage Service (API Client)
 * 
 * Uploads files to the Backend /api/media/upload endpoint.
 * Serves files from Backend /uploads directory.
 */

// Base URL for API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

interface UploadResult {
    data: { path: string; fullPath: string } | null;
    error: { message: string } | null;
}

interface PublicUrlResult {
    data: { publicUrl: string };
}

class StorageBucket {
    private bucketName: string;

    constructor(bucketName: string) {
        this.bucketName = bucketName;
    }

    /**
     * Upload a file to the backend
     */
    async upload(
        path: string,
        file: File,
        options?: { upsert?: boolean }
    ): Promise<UploadResult> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('caption', path); // Use path as caption/filename hint?

            // Get auth token
            const sessionStr = localStorage.getItem('umeed-auth-session');
            let token = '';
            if (sessionStr) {
                try {
                    token = JSON.parse(sessionStr).access_token;
                } catch { }
            }

            const response = await fetch(`${API_URL}/media/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Content-Type is set automatically by fetch for FormData
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                return { data: null, error: { message: data.error || 'Upload failed' } };
            }

            // Backend returns: { id, url, ... }
            // url is relative like "/uploads/filename.ext"

            return {
                data: {
                    path: data.url, // Return the URL as the path
                    fullPath: data.url
                },
                error: null
            };

        } catch (error) {
            console.error('[Storage] Upload error:', error);
            return {
                data: null,
                error: { message: (error as Error).message }
            };
        }
    }

    /**
     * Get the public URL for a file
     */
    getPublicUrl(path: string): PublicUrlResult {
        // Path might already be a full URL if it came from upload result
        if (path.startsWith('http')) {
            return { data: { publicUrl: path } };
        }

        // If it starts with /uploads, just append to base
        if (path.startsWith('/uploads')) {
            return { data: { publicUrl: `${BASE_URL}${path}` } };
        }

        // Otherwise assume it's a relative path in this bucket (legacy)
        return {
            data: {
                publicUrl: `${BASE_URL}/uploads/${path}`
            }
        };
    }

    /**
     * Delete a file (Not fully supported by generic backend yet, stubbed)
     */
    async remove(paths: string[]): Promise<{ data: null; error: null }> {
        // TODO: Implement delete endpoint if needed
        return { data: null, error: null };
    }

    /**
     * List files (Not fully supported by generic backend yet, stubbed)
     */
    async list(path?: string): Promise<{ data: { name: string }[]; error: null }> {
        return { data: [], error: null };
    }
}

class StorageService {
    private buckets: Map<string, StorageBucket> = new Map();

    from(bucketName: string): StorageBucket {
        if (!this.buckets.has(bucketName)) {
            this.buckets.set(bucketName, new StorageBucket(bucketName));
        }
        return this.buckets.get(bucketName)!;
    }
}

export const storageService = new StorageService();
export default storageService;
