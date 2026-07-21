import apiClient from "../lib/apiClient";

export interface AppSetting {
  key: string;
  value: string;
}

export const settingsApi = {
  getAll: () =>
    apiClient.get<AppSetting[]>("/app_settings").then((r) => r.data),

  upsert: (key: string, value: string) =>
    apiClient
      .post<AppSetting>("/app_settings", { key, value })
      .then((r) => r.data),

  remove: (key: string) =>
    apiClient.delete(`/app_settings/${key}`).then((r) => r.data),
};
