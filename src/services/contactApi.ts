import apiClient from "../lib/apiClient";

export const contactApi = {
  send: (data: { name: string; email: string; message: string }) =>
    apiClient.post("/contact_messages", data).then((r) => r.data),
};
