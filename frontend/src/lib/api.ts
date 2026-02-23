/**
 * Local Database Client
 * 
 * Unified client that replaces Supabase with local SQLite.
 * Provides the same API surface as Supabase client for compatibility.
 */

import dbService from '@/lib/dbService';
import authService from '@/lib/authService';
import storageService from '@/lib/storageService';

// Re-export types for compatibility
export type { User, Session } from '@/lib/authService';

// Combined client interface
export const api = {
    // Database operations - matches api.from(table).select()...
    from: dbService.from.bind(dbService),

    // Auth operations - matches api.auth.signIn()...
    auth: authService,

    // Storage operations - matches api.storage.from(bucket)...
    storage: storageService,

    // Realtime channels (stub for compatibility)
    channel: (name: string) => ({
        on: (_event: string, _filter: any, _callback: any) => ({
            subscribe: () => ({ unsubscribe: () => { } })
        }),
        subscribe: () => ({ unsubscribe: () => { } })
    }),

    removeChannel: (_channel: any) => { }
};

// Demo mode is no longer needed - all data is local
export const isDemoMode = false;

// Export individual services for direct access
export { dbService, authService, storageService };

export default api;
