import apiClient from "../lib/apiClient";

export type ContentType = "text" | "image" | "number" | "json";

export interface ContentItem {
  id: string;
  section: string;
  key: string;
  value: string | null;
  type: ContentType;
  updated_at: string;
}

export const contentApi = {
  getAll: () =>
    apiClient
      .get<Record<string, Record<string, string>>>("/content")
      .then((r) => r.data),

  getSection: (section: string) =>
    apiClient
      .get<Record<string, string>>(`/content/${section}`)
      .then((r) => r.data),

  set: (
    section: string,
    key: string,
    value: string | null,
    type: ContentType = "text",
  ) =>
    apiClient
      .post("/content", { section, key, value, type })
      .then((r) => r.data),

  setBulk: (
    items: Array<{
      section: string;
      key: string;
      value: string | null;
      type?: ContentType;
    }>,
  ) => apiClient.post("/content/bulk", { items }).then((r) => r.data),

  remove: (section: string, key: string) =>
    apiClient.delete(`/content/${section}/${key}`).then((r) => r.data),
};
