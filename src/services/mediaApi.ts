import apiClient from "../lib/apiClient";

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001";

export interface MediaItem {
  id: string;
  url: string;
  caption?: string;
}

export const mediaApi = {
  upload: async (file: File, caption?: string): Promise<MediaItem> => {
    const formData = new FormData();
    formData.append("file", file);
    if (caption) formData.append("caption", caption);

    const { data } = await apiClient.post<MediaItem>(
      "/media/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  },

  getPublicUrl: (path: string): string => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    if (path.startsWith("/uploads")) return `${BASE_URL}${path}`;
    return `${BASE_URL}/uploads/${path}`;
  },

  remove: (id: string) => apiClient.delete(`/media/${id}`).then((r) => r.data),
};
