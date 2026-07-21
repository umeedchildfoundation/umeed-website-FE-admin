import apiClient from "../lib/apiClient";
import type { Student } from "../types/student";

export const studentsApi = {
  getAll: (params?: Record<string, string | undefined>) =>
    apiClient.get<Student[]>("/students", { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Student>(`/students/${id}`).then((r) => r.data),

  create: (data: Partial<Student>) =>
    apiClient.post<Student>("/students", data).then((r) => r.data),

  update: (id: string, data: Partial<Student>) =>
    apiClient.patch<Student>(`/students/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/students/${id}`).then((r) => r.data),
};
