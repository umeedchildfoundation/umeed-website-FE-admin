/**
 * Content Service
 *
 * Thin wrapper around contentApi used by SiteContentContext.
 * Re-exports types needed by components.
 */
import { contentApi, type ContentType } from "../services/contentApi";

export type { ContentType };

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

export async function getContent(
  section: string,
  key: string,
): Promise<string | null> {
  try {
    const data = await contentApi.getSection(section);
    return data[key] ?? null;
  } catch {
    return null;
  }
}

export async function getSectionContent(
  section: string,
): Promise<SectionContent> {
  try {
    return await contentApi.getSection(section);
  } catch {
    return {};
  }
}

export async function getAllContent(): Promise<Record<string, SectionContent>> {
  try {
    return await contentApi.getAll();
  } catch {
    return {};
  }
}

export async function setContent(
  section: string,
  key: string,
  value: string | null,
  type: ContentType = "text",
): Promise<void> {
  try {
    await contentApi.set(section, key, value, type);
  } catch (e) {
    console.error("Failed to set content", e);
  }
}

export async function setBulkContent(
  items: Array<{
    section: string;
    key: string;
    value: string | null;
    type?: ContentType;
  }>,
): Promise<void> {
  try {
    await contentApi.setBulk(items);
  } catch (e) {
    console.error("Failed to bulk set content", e);
  }
}

export async function deleteContent(
  section: string,
  key: string,
): Promise<void> {
  try {
    await contentApi.remove(section, key);
  } catch (e) {
    console.error("Failed to delete content", e);
  }
}

export async function getCards<T extends FeatureCard | ImpactCard>(
  key: "feature_cards" | "impact_cards",
): Promise<T[]> {
  const json = await getContent("cards", key);
  if (!json) return [];
  try {
    return JSON.parse(json) as T[];
  } catch {
    return [];
  }
}

export async function setCards<T extends FeatureCard | ImpactCard>(
  key: "feature_cards" | "impact_cards",
  cards: T[],
): Promise<void> {
  await setContent("cards", key, JSON.stringify(cards), "json");
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const json = await getContent("about", "team_members");
  if (!json) return [];
  try {
    return JSON.parse(json) as TeamMember[];
  } catch {
    return [];
  }
}

export async function setTeamMembers(members: TeamMember[]): Promise<void> {
  await setContent("about", "team_members", JSON.stringify(members), "json");
}

export async function getValues(): Promise<ValueCard[]> {
  const json = await getContent("about", "values");
  if (!json) return [];
  try {
    return JSON.parse(json) as ValueCard[];
  } catch {
    return [];
  }
}

export async function setValues(values: ValueCard[]): Promise<void> {
  await setContent("about", "values", JSON.stringify(values), "json");
}

// No-op: defaults are seeded by the backend; kept for API compatibility
export async function initializeDefaultContent(): Promise<void> {
  // no-op
}

export const contentService = {
  getContent,
  getSectionContent,
  getAllContent,
  setContent,
  setBulkContent,
  deleteContent,
  getCards,
  setCards,
  getTeamMembers,
  setTeamMembers,
  getValues,
  setValues,
};

export default contentService;
