import apiClient from "../lib/apiClient";

export interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  occupation: string | null;
  availability: string | null;
  motivation: string | null;
  skills_subjects: string[] | null;
  preferred_languages: string[] | null;
  status: "pending" | "approved" | "rejected" | "inactive";
  created_at: string | null;
}

export const applicationsApi = {
  getAll: (params?: Record<string, string | undefined>) =>
    apiClient
      .get<Application[]>("/volunteer_applications", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<Application>(`/volunteer_applications/${id}`)
      .then((r) => r.data),

  create: (data: Partial<Application>) =>
    apiClient
      .post<Application>("/volunteer_applications", data)
      .then((r) => r.data),

  update: (id: string, data: Partial<Application>) =>
    apiClient
      .patch<Application>(`/volunteer_applications/${id}`, data)
      .then((r) => r.data),
};
