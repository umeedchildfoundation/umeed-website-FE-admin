import apiClient from "../lib/apiClient";
import type { Session } from "../types/session";

export const sessionsApi = {
  getAll: (params?: Record<string, string | undefined>) =>
    apiClient.get<Session[]>("/sessions", { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Session>(`/sessions/${id}`).then((r) => r.data),

  create: (data: Partial<Session>) =>
    apiClient.post<Session>("/sessions", data).then((r) => r.data),

  update: (id: string, data: Partial<Session>) =>
    apiClient.patch<Session>(`/sessions/${id}`, data).then((r) => r.data),

  save: (data: Partial<Session>) =>
    data.id
      ? apiClient
          .patch<Session>(`/sessions/${data.id}`, data)
          .then((r) => r.data)
      : apiClient.post<Session>("/sessions", data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/sessions/${id}`).then((r) => r.data),
};
