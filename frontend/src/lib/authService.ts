/**
 * Authentication Service (API Client)
 * 
 * Replaces the local SQLite implementation with a REST API client
 * that connects to the Production Backend.
 */

import { toast } from "sonner";

// Base URL for API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SESSION_KEY = 'umeed-auth-session';

export interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    role: 'volunteer' | 'admin' | 'super_admin';
    user_metadata?: any;
    preferences?: any;
    volunteerId?: string | null;
    volunteerStatus?: string | null;
}

export interface Session {
    user: User;
    access_token: string;
    expires_at: number; // For compatibility, though JWT has its own expiry
}

type AuthCallback = (event: string, session: Session | null) => void;

class AuthService {
    private listeners: AuthCallback[] = [];
    private currentSession: Session | null = null;

    constructor() {
        this.loadSession();
    }

    private loadSession(): void {
        try {
            const stored = localStorage.getItem(SESSION_KEY);
            if (stored) {
                const session = JSON.parse(stored) as Session;

                // Validate if token looks like a JWT (has 2 dots)
                // This forces logout for users with legacy UUID tokens
                const isValidToken = session.access_token &&
                    typeof session.access_token === 'string' &&
                    session.access_token.split('.').length === 3;

                if (isValidToken) {
                    this.currentSession = session;
                } else {
                    console.warn('[Auth] Invalid or legacy token detected, clearing session');
                    localStorage.removeItem(SESSION_KEY);
                }
            }
        } catch (error) {
            console.error('[Auth] Failed to load session:', error);
            localStorage.removeItem(SESSION_KEY);
        }
    }

    private saveSession(session: Session | null): void {
        if (session) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } else {
            localStorage.removeItem(SESSION_KEY);
        }
        this.currentSession = session;
    }

    private notifyListeners(event: string): void {
        for (const callback of this.listeners) {
            try {
                callback(event, this.currentSession);
            } catch (error) {
                console.error('[Auth] Listener error:', error);
            }
        }
    }

    async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
        // Optionally verify token with backend here
        return { data: { session: this.currentSession }, error: null };
    }

    onAuthStateChange(callback: AuthCallback): { data: { subscription: { unsubscribe: () => void } } } {
        this.listeners.push(callback);
        setTimeout(() => {
            callback('INITIAL_SESSION', this.currentSession);
        }, 0);
        return {
            data: {
                subscription: {
                    unsubscribe: () => {
                        this.listeners = this.listeners.filter(cb => cb !== callback);
                    }
                }
            }
        };
    }

    async signInWithPassword({ email, password }: { email: string; password: string }): Promise<{
        data: { session: Session | null } | null;
        error: { message: string } | null;
    }> {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                return { data: null, error: { message: data.error || 'Login failed' } };
            }

            const user: User = {
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.fullName,
                avatar_url: data.user.avatarUrl,
                role: data.user.role,
                volunteerId: data.user.volunteerId,
                volunteerStatus: data.user.volunteerStatus,
                user_metadata: { full_name: data.user.fullName }
            };

            const session: Session = {
                user,
                access_token: data.token,
                expires_at: Date.now() + 24 * 60 * 60 * 1000 // 24h approximation
            };

            this.saveSession(session);
            this.notifyListeners('SIGNED_IN');

            return { data: { session }, error: null };
        } catch (error) {
            console.error('[Auth] Sign in error:', error);
            return { data: null, error: { message: 'Network error during login' } };
        }
    }

    async signUp({ email, password, options }: {
        email: string;
        password: string;
        options?: { data?: { full_name?: string }; emailRedirectTo?: string; autoLogin?: boolean };
    }): Promise<{
        data: { session: Session | null; user: User | null } | null;
        error: { message: string } | null;
    }> {
        try {
            const fullName = options?.data?.full_name || email.split('@')[0];
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullName })
            });

            const data = await response.json();

            if (!response.ok) {
                return { data: null, error: { message: data.error || 'Registration failed' } };
            }

            const user: User = {
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.fullName,
                avatar_url: null,
                role: data.user.role,
                user_metadata: { full_name: data.user.fullName }
            };

            // Respect autoLogin option
            if (options?.autoLogin === false) {
                return { data: { session: null, user }, error: null };
            }

            const session: Session = {
                user,
                access_token: data.token,
                expires_at: Date.now() + 24 * 60 * 60 * 1000
            };

            this.saveSession(session);
            this.notifyListeners('SIGNED_IN');

            return { data: { session, user }, error: null };

        } catch (error) {
            console.error('[Auth] Sign up error:', error);
            return { data: null, error: { message: 'Network error during registration' } };
        }
    }

    async signOut(options?: { scope?: 'local' | 'global' }): Promise<{ error: null }> {
        this.saveSession(null);
        this.notifyListeners('SIGNED_OUT');
        return { error: null };
    }

    async changePassword({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }): Promise<{
        data: { message: string } | null;
        error: { message: string } | null;
    }> {
        try {
            if (!this.currentSession) {
                return { data: null, error: { message: 'Not authenticated' } };
            }

            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentSession.access_token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                return { data: null, error: { message: data.error || 'Change password failed' } };
            }

            return { data: { message: data.message }, error: null };
        } catch (error) {
            console.error('[Auth] Change password error:', error);
            return { data: null, error: { message: 'Network error' } };
        }
    }

    async updateUser(data: { data?: { full_name?: string; avatar_url?: string; preferences?: any } }): Promise<{

        data: { user: User } | null;
        error: { message: string } | null;
    }> {
        try {
            if (!this.currentSession) {
                return { data: null, error: { message: 'Not authenticated' } };
            }

            const response = await fetch(`${API_URL}/auth/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentSession.access_token}`
                },
                body: JSON.stringify({
                    fullName: data.data?.full_name,
                    avatarUrl: data.data?.avatar_url,
                    preferences: data.data?.preferences
                })
            });

            const resData = await response.json();

            if (!response.ok) {
                return { data: null, error: { message: resData.error || 'Update failed' } };
            }

            // Update local session
            if (this.currentSession && this.currentSession.user) {
                this.currentSession.user.full_name = resData.fullName;
                this.currentSession.user.avatar_url = resData.avatarUrl;
                this.currentSession.user.user_metadata = resData.user_metadata || this.currentSession.user.user_metadata;
                this.currentSession.user.preferences = resData.preferences || this.currentSession.user.preferences;
                this.saveSession(this.currentSession);
            }

            return { data: { user: this.currentSession!.user }, error: null };

        } catch (error) {
            console.error('[Auth] Update user error:', error);
            return { data: null, error: { message: 'Network error' } };
        }
    }

    async refreshSession(): Promise<{ data: { session: Session | null }; error: null }> {
        // Check validity with /me endpoint?
        if (this.currentSession) {
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${this.currentSession.access_token}` }
                });
                if (response.ok) {
                    const userData = await response.json();
                    // Update user info
                    this.currentSession.user = {
                        ...this.currentSession.user,
                        full_name: userData.fullName,
                        role: userData.role,
                        id: userData.id,
                        email: userData.email,
                        avatar_url: userData.avatarUrl,
                        preferences: userData.preferences
                    };
                    this.saveSession(this.currentSession);
                } else {
                    // Invalid token
                    this.signOut();
                }
            } catch (e) {
                // Network error, keep session for now or sign out?
            }
        }
        return { data: { session: this.currentSession }, error: null };
    }

    getUser(): User | null {
        return this.currentSession?.user ?? null;
    }
}

export const authService = new AuthService();
export default authService;
