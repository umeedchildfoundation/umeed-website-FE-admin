import apiClient from "../lib/apiClient";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  tags: string[] | null;
}

export const eventsApi = {
  getAll: (params?: Record<string, string | undefined>) =>
    apiClient.get<Event[]>("/events", { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Event>(`/events/${id}`).then((r) => r.data),

  create: (data: Partial<Event>) =>
    apiClient.post<Event>("/events", data).then((r) => r.data),

  update: (id: string, data: Partial<Event>) =>
    apiClient.patch<Event>(`/events/${id}`, data).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/events/${id}`).then((r) => r.data),
};
