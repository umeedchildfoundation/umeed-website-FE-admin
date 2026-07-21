import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
});

// Attach auth token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem("umeed-auth-session");
  if (raw) {
    try {
      const { access_token } = JSON.parse(raw);
      if (access_token) {
        config.headers.Authorization = `Bearer ${access_token}`;
      }
    } catch {
      // malformed session – ignore
    }
  }
  return config;
});

// On 401, clear session and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("umeed-auth-session");
      window.location.href = "/login";
    }

    // Surface the backend's error message (e.g. "User already exists") so
    // every `err.message` / `(err as Error).message` call site downstream
    // shows it instead of axios's generic "Request failed with status code…"
    const backendMessage =
      error.response?.data?.message ?? error.response?.data?.error;
    if (backendMessage) {
      error.message = backendMessage;
    }

    return Promise.reject(error);
  },
);

export default apiClient;
