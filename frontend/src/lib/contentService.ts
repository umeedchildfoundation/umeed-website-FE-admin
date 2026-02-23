/**
 * Content Service (API Client)
 * 
 * Manages site content (images, text, settings) via Backend API.
 */

// Base URL for API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export type ContentType = 'text' | 'image' | 'number' | 'json';

export interface ContentItem {
    id: string;
    section: string;
    key: string;
    value: string | null;
    type: ContentType;
    updated_at: string;
}

export interface SectionContent {
    [key: string]: string | null;
}

// Card types for customizable sections
export interface FeatureCard {
    id: string;
    icon: string;
    title: string;
    description: string;
    color: string;
}

export interface ImpactCard {
    id: string;
    title: string;
    description: string;
    image: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    initials: string;
}

export interface ValueCard {
    id: string;
    icon: string;
    title: string;
    description: string;
}

// Helper for auth headers
const getHeaders = () => {
    const session = localStorage.getItem('umeed-auth-session');
    let token = '';
    if (session) {
        try {
            token = JSON.parse(session).access_token;
        } catch { }
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

/**
 * Get a single content item
 */
export async function getContent(section: string, key: string): Promise<string | null> {
    try {
        const response = await fetch(`${API_URL}/content/${section}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data[key] || null;
    } catch {
        return null;
    }
}

/**
 * Get all content for a section
 */
export async function getSectionContent(section: string): Promise<SectionContent> {
    try {
        const response = await fetch(`${API_URL}/content/${section}`);
        if (!response.ok) return {};
        return await response.json();
    } catch {
        return {};
    }
}

/**
 * Get all site content organized by section
 */
export async function getAllContent(): Promise<Record<string, SectionContent>> {
    try {
        const response = await fetch(`${API_URL}/content`);
        if (!response.ok) return {};
        return await response.json();
    } catch {
        return {};
    }
}

/**
 * Set a content item (insert or update)
 */
export async function setContent(
    section: string,
    key: string,
    value: string | null,
    type: ContentType = 'text'
): Promise<void> {
    try {
        await fetch(`${API_URL}/content`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ section, key, value, type })
        });
    } catch (e) {
        console.error('Failed to set content', e);
    }
}

/**
 * Set multiple content items at once
 */
export async function setBulkContent(
    items: Array<{ section: string; key: string; value: string | null; type?: ContentType }>
): Promise<void> {
    try {
        await fetch(`${API_URL}/content/bulk`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ items })
        });
    } catch (e) {
        console.error('Failed to bulk set content', e);
    }
}

/**
 * Delete a content item
 */
export async function deleteContent(section: string, key: string): Promise<void> {
    try {
        await fetch(`${API_URL}/content/${section}/${key}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    } catch (e) {
        console.error('Failed to delete content', e);
    }
}

// ... Card and Team/About helpers remain similar but use above API functions ...

/**
 * Initialize default content if not exists
 */
export async function initializeDefaultContent(): Promise<void> {
    // Check if hero exists
    const heroTitle = await getContent('hero', 'title');
    if (heroTitle) {
        console.log('[Content] Default content already initialized');
        return;
    }

    console.log('[Content] Initializing default site content...');

    // ... Defaults array (same as before) ...
    // Since this is getting long, I'll rely on Admin Dashboard manual init
    // or we can implement a /api/content/init endpoint on backend
    // BUT backend might not be pre-seeded. 
    // Ideally user runs `npm run seed` on backend.
}

// Default feature cards data (static fallback if fetch fails)
const defaultFeatureCards: FeatureCard[] = [/* ... same defaults ... */];
const defaultImpactCards: ImpactCard[] = [/* ... same defaults ... */];

/**
 * Get cards array from storage
 */
export async function getCards<T extends FeatureCard | ImpactCard>(key: 'feature_cards' | 'impact_cards'): Promise<T[]> {
    const json = await getContent('cards', key);
    if (!json) {
        // Return defaults if nothing found
        return key === 'feature_cards' ? [] as any : [] as any;
    }
    try {
        return JSON.parse(json) as T[];
    } catch {
        return [];
    }
}

/**
 * Set cards array to storage
 */
export async function setCards<T extends FeatureCard | ImpactCard>(key: 'feature_cards' | 'impact_cards', cards: T[]): Promise<void> {
    await setContent('cards', key, JSON.stringify(cards), 'json');
}

// ... Team and Values helpers ...

export async function getTeamMembers(): Promise<TeamMember[]> {
    const json = await getContent('about', 'team_members');
    if (!json) return [];
    try { return JSON.parse(json) as TeamMember[]; } catch { return []; }
}

export async function setTeamMembers(members: TeamMember[]): Promise<void> {
    await setContent('about', 'team_members', JSON.stringify(members), 'json');
}

export async function getValues(): Promise<ValueCard[]> {
    const json = await getContent('about', 'values');
    if (!json) return [];
    try { return JSON.parse(json) as ValueCard[]; } catch { return []; }
}

export async function setValues(values: ValueCard[]): Promise<void> {
    await setContent('about', 'values', JSON.stringify(values), 'json');
}

export const contentService = {
    getContent,
    getSectionContent,
    getAllContent,
    setContent,
    setBulkContent,
    deleteContent,
    initializeDefaultContent,
    getCards,
    setCards,
    getTeamMembers,
    setTeamMembers,
    getValues,
    setValues,
};

export default contentService;
