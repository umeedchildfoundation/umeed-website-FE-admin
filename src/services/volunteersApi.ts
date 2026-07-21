import apiClient from "../lib/apiClient";
import type { Volunteer } from "../types/volunteer";

export const volunteersApi = {
  getAll: (params?: Record<string, string | undefined>) =>
    apiClient.get<Volunteer[]>("/volunteers", { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Volunteer>(`/volunteers/${id}`).then((r) => r.data),

  create: (data: Partial<Volunteer>) =>
    apiClient.post<Volunteer>("/volunteers", data).then((r) => r.data),

  update: (id: string, data: Partial<Volunteer>) =>
    apiClient.patch<Volunteer>(`/volunteers/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/volunteers/${id}`).then((r) => r.data),
};
