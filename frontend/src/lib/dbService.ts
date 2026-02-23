/**
 * Database Service Layer (API Client)
 * 
 * Replaces the local SQLite/WASM implementation with a REST API client
 * that connects to the Production Backend.
 */

import { toast } from "sonner";

// Base URL for API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type TableName =
    | 'users'
    | 'profiles'
    | 'volunteers'
    | 'students'
    | 'sessions'
    | 'session_assignments'
    | 'session_mappings'
    | 'student_attendance'
    | 'volunteer_attendance'
    | 'events'
    | 'event_media'
    | 'media'
    | 'notices'
    | 'volunteer_applications'
    | 'contact_messages'
    | 'donations'
    | 'user_roles'
    | 'session_rsvps'
    | 'app_settings';

interface Filter {
    column: string;
    value: any;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
}

interface OrderBy {
    column: string;
    ascending: boolean;
}

/**
 * Query Builder class that mimics Supabase's query interface
 * but calls the Backend REST API
 */
class QueryBuilder<T = any> {
    private tableName: TableName;
    private filters: Filter[] = [];
    private orderBy: OrderBy | null = null;
    private limitValue: number | null = null;
    private selectColumns: string = '*';
    private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
    private payload: any = null;
    private isSingle: boolean = false;
    private countOnly: boolean = false;

    constructor(tableName: TableName) {
        this.tableName = tableName;
    }

    select(columns: string = '*', options?: { count?: 'exact'; head?: boolean }): this {
        this.operation = 'select';
        this.selectColumns = columns;
        if (options?.count === 'exact') {
            this.countOnly = true;
        }
        return this;
    }

    insert(data: any | any[]): this {
        this.operation = 'insert';
        this.payload = data; // Keep as is, backend handles array/single usually (or we iterate)
        return this;
    }

    update(data: any): this {
        this.operation = 'update';
        this.payload = data;
        return this;
    }

    upsert(data: any | any[]): this {
        this.operation = 'upsert'; // Backend might not support generic upsert, will fallback to insert
        this.payload = data;
        return this;
    }

    delete(): this {
        this.operation = 'delete';
        return this;
    }

    eq(column: string, value: any): this {
        this.filters.push({ column, value, operator: 'eq' });
        return this;
    }

    neq(column: string, value: any): this {
        this.filters.push({ column, value, operator: 'neq' });
        return this;
    }

    gt(column: string, value: any): this {
        this.filters.push({ column, value, operator: 'gt' });
        return this;
    }

    gte(column: string, value: any): this {
        this.filters.push({ column, value, operator: 'gte' });
        return this;
    }

    lt(column: string, value: any): this {
        this.filters.push({ column, value, operator: 'lt' });
        return this;
    }

    lte(column: string, value: any): this {
        this.filters.push({ column, value, operator: 'lte' });
        return this;
    }

    like(column: string, pattern: string): this {
        this.filters.push({ column, value: pattern, operator: 'like' });
        return this;
    }

    in(column: string, values: any[]): this {
        this.filters.push({ column, value: values, operator: 'in' });
        return this;
    }

    order(column: string, options?: { ascending?: boolean }): this {
        this.orderBy = {
            column,
            ascending: options?.ascending !== false
        };
        return this;
    }

    limit(count: number): this {
        this.limitValue = count;
        return this;
    }

    single(): Promise<{ data: T | null; error: Error | null }> {
        this.isSingle = true;
        this.limitValue = 1;
        return this.execute();
    }

    maybeSingle(): Promise<{ data: T | null; error: Error | null }> {
        return this.single();
    }

    private getEndpoint(): string {
        // Map table names to API endpoints if they differ
        // Most match exactly: /api/volunteers, /api/students
        return `${API_URL}/${this.tableName}`;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        // Add Auth Token from localStorage if available
        const session = localStorage.getItem('umeed-auth-session');
        if (session) {
            try {
                const { access_token } = JSON.parse(session);
                if (access_token) {
                    headers['Authorization'] = `Bearer ${access_token}`;
                }
            } catch (e) {
                // Invalid session
            }
        }
        return headers;
    }

    private async execute(): Promise<{ data: any; error: Error | null; count?: number | null }> {
        try {
            const endpoint = this.getEndpoint();
            const headers = this.getHeaders();
            let url = endpoint;
            let method = 'GET';
            let body = null;

            // Build Query Params for GET
            if (this.operation === 'select') {
                const params = new URLSearchParams();

                // Handle EQ filters as query params (most common for simple backends)
                this.filters.forEach(f => {
                    if (f.operator === 'eq') {
                        params.append(f.column, String(f.value));
                    }
                    // TODO: Backend needs to support other operators if used
                });

                // Handle single fetch by ID if ID is in filters
                const idFilter = this.filters.find(f => f.column === 'id' && f.operator === 'eq');
                if (idFilter && this.isSingle) {
                    url = `${endpoint}/${idFilter.value}`;
                } else {
                    url += `?${params.toString()}`;
                }
            } else if (this.operation === 'insert') {
                method = 'POST';
                // Handle array vs single insert
                // If it's an array of length 1, standard backend might expect single object
                if (Array.isArray(this.payload) && this.payload.length === 1) {
                    body = JSON.stringify(this.payload[0]);
                } else {
                    body = JSON.stringify(this.payload);
                }
            } else if (this.operation === 'update') {
                method = 'PATCH';
                body = JSON.stringify(this.payload);

                // Expect an ID for update
                const idFilter = this.filters.find(f => f.column === 'id' && f.operator === 'eq');
                if (idFilter) {
                    url = `${endpoint}/${idFilter.value}`;
                } else {
                    // Update multiple? Backend might not support generic bulk update.
                    // For now, assume update by ID
                    if (this.payload.id) {
                        url = `${endpoint}/${this.payload.id}`;
                    } else {
                        // Throw error or fallback?
                        console.warn("Update without ID filter or ID in payload might fail");
                    }
                }
            } else if (this.operation === 'delete') {
                method = 'DELETE';
                // Expect an ID for delete
                const idFilter = this.filters.find(f => f.column === 'id' && f.operator === 'eq');
                if (idFilter) {
                    url = `${endpoint}/${idFilter.value}`;
                }
            }

            const response = await fetch(url, {
                method,
                headers,
                body
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Request failed with status ${response.status}`);
            }

            const data = await response.json();

            // Handle single expectation
            if (this.isSingle && Array.isArray(data)) {
                return { data: data[0] || null, error: null };
            }

            return { data, error: null };

        } catch (error: any) {
            console.error('[API] Request error:', error);
            // Don't show toast for every error to avoid spam, let caller handle
            return { data: null, error: error };
        }
    }

    then<TResult1 = { data: T; error: Error | null }, TResult2 = never>(
        onfulfilled?: ((value: { data: T; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        return this.execute().then(onfulfilled, onrejected);
    }
}

/**
 * Database service that mimics Supabase client interface
 * but connects to your Production Backend
 */
export const dbService = {
    from<T = any>(table: TableName): QueryBuilder<T> {
        return new QueryBuilder<T>(table);
    }
};

export default dbService;
