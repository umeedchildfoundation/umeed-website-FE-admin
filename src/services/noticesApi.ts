import apiClient from "../lib/apiClient";

export interface Notice {
  id: string;
  title: string;
  description: string | null;
  published_date: string | null;
  visibility: "public" | "internal";
  attachment_url?: string | null;
}

export const noticesApi = {
  getAll: (params?: Record<string, string | undefined>) =>
    apiClient.get<Notice[]>("/notices", { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Notice>(`/notices/${id}`).then((r) => r.data),

  create: (data: Partial<Notice>) =>
    apiClient.post<Notice>("/notices", data).then((r) => r.data),

  update: (id: string, data: Partial<Notice>) =>
    apiClient.patch<Notice>(`/notices/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/notices/${id}`).then((r) => r.data),
};
