/**
 * Site Content Context
 * 
 * Provides site content (CMS data) throughout the application.
 * Allows components to access and update editable content.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    getAllContent,
    setContent as dbSetContent,
    initializeDefaultContent,
    getCards as dbGetCards,
    setCards as dbSetCards,
    getTeamMembers as dbGetTeamMembers,
    setTeamMembers as dbSetTeamMembers,
    getValues as dbGetValues,
    setValues as dbSetValues,
    type SectionContent,
    type FeatureCard,
    type ImpactCard,
    type TeamMember,
    type ValueCard
} from '@/lib/contentService';

interface SiteContentContextType {
    content: Record<string, SectionContent>;
    loading: boolean;
    error: Error | null;
    getContent: (section: string, key: string, defaultValue?: string) => string;
    setContent: (section: string, key: string, value: string | null) => Promise<void>;
    refreshContent: () => Promise<void>;
    // Card methods
    getFeatureCards: () => Promise<FeatureCard[]>;
    getImpactCards: () => Promise<ImpactCard[]>;
    setFeatureCards: (cards: FeatureCard[]) => Promise<void>;
    setImpactCards: (cards: ImpactCard[]) => Promise<void>;
    // About page methods
    getTeamMembers: () => Promise<TeamMember[]>;
    setTeamMembers: (members: TeamMember[]) => Promise<void>;
    getValues: () => Promise<ValueCard[]>;
    setValues: (values: ValueCard[]) => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
    const [content, setContentState] = useState<Record<string, SectionContent>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadContent = useCallback(async () => {
        try {
            // Initialize defaults if needed
            await initializeDefaultContent();
            // Load all content
            const data = await getAllContent();
            setContentState(data);
            setError(null);
        } catch (err) {
            console.error('[SiteContent] Failed to load content:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    const getContent = useCallback((section: string, key: string, defaultValue: string = ''): string => {
        return content[section]?.[key] ?? defaultValue;
    }, [content]);

    const updateContent = useCallback(async (section: string, key: string, value: string | null): Promise<void> => {
        try {
            await dbSetContent(section, key, value);
            // Update local state
            setContentState(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [key]: value
                }
            }));
        } catch (err) {
            console.error('[SiteContent] Failed to update content:', err);
            throw err;
        }
    }, []);

    const refreshContent = useCallback(async () => {
        setLoading(true);
        await loadContent();
    }, [loadContent]);

    // Card methods
    const getFeatureCards = useCallback(async (): Promise<FeatureCard[]> => {
        return dbGetCards<FeatureCard>('feature_cards');
    }, []);

    const getImpactCards = useCallback(async (): Promise<ImpactCard[]> => {
        return dbGetCards<ImpactCard>('impact_cards');
    }, []);

    const setFeatureCards = useCallback(async (cards: FeatureCard[]): Promise<void> => {
        await dbSetCards('feature_cards', cards);
    }, []);

    const setImpactCards = useCallback(async (cards: ImpactCard[]): Promise<void> => {
        await dbSetCards('impact_cards', cards);
    }, []);

    // About page methods
    const getTeamMembers = useCallback(async (): Promise<TeamMember[]> => {
        return dbGetTeamMembers();
    }, []);

    const setTeamMembers = useCallback(async (members: TeamMember[]): Promise<void> => {
        await dbSetTeamMembers(members);
    }, []);

    const getValues = useCallback(async (): Promise<ValueCard[]> => {
        return dbGetValues();
    }, []);

    const setValuesFn = useCallback(async (values: ValueCard[]): Promise<void> => {
        await dbSetValues(values);
    }, []);

    return (
        <SiteContentContext.Provider
            value={{
                content,
                loading,
                error,
                getContent,
                setContent: updateContent,
                refreshContent,
                getFeatureCards,
                getImpactCards,
                setFeatureCards,
                setImpactCards,
                getTeamMembers,
                setTeamMembers,
                getValues,
                setValues: setValuesFn,
            }}
        >
            {children}
        </SiteContentContext.Provider>
    );
}

/**
 * Hook to access site content
 */
export function useSiteContent() {
    const context = useContext(SiteContentContext);
    if (context === undefined) {
        throw new Error('useSiteContent must be used within a SiteContentProvider');
    }
    return context;
}

/**
 * Hook to get a specific content value with fallback
 */
export function useContent(section: string, key: string, defaultValue: string = ''): string {
    const { getContent } = useSiteContent();
    return getContent(section, key, defaultValue);
}

/**
 * Hook to get all content for a section
 */
export function useSectionContent(section: string): SectionContent {
    const { content } = useSiteContent();
    return content[section] || {};
}
