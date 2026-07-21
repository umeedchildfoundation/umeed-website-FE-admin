import apiClient from "../lib/apiClient";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: "volunteer" | "admin" | "super_admin";
  volunteerId?: string | null;
  volunteerStatus?: string | null;
  preferences?: Record<string, unknown>;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient
      .post<AuthSession>("/auth/login", { email, password })
      .then((r) => r.data),

  register: (email: string, password: string, fullName: string) =>
    apiClient
      .post<AuthSession>("/auth/register", { email, password, fullName })
      .then((r) => r.data),

  getMe: () => apiClient.get<AuthUser>("/auth/me").then((r) => r.data),

  updateMe: (data: {
    fullName?: string;
    avatarUrl?: string;
    preferences?: Record<string, unknown>;
  }) => apiClient.patch<AuthUser>("/auth/me", data).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient
      .post<{ message: string }>("/auth/change-password", {
        currentPassword,
        newPassword,
      })
      .then((r) => r.data),
};
