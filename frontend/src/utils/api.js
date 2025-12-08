import axios from "axios";

// ---------------------------------------------------------
// ✅ AUTO-DETECT ENVIRONMENT (dev ou production Render)
// ---------------------------------------------------------
const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname.includes("onrender.com")
    ? "https://taskflow-1-jwh1.onrender.com/api"
    : "http://localhost:5000/api");

// ---------------------------------------------------------
// 🔧 Axios instance
// ---------------------------------------------------------
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ---------------------------------------------------------
// 🔐 Add JWT to headers
// ---------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------
// 🚨 Error handling & retry logic
// ---------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn("Unauthorized → clearing session");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // 503 Retry once
    if (error.response?.status === 503 && !originalRequest._retry) {
      originalRequest._retry = true;
      const wait = error.response.data?.retryAfter || 3;
      console.log(`Server unavailable → retrying in ${wait}s`);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      return api(originalRequest);
    }

    // Network retry
    if (
      (error.code === "ECONNABORTED" || error.message === "Network Error") &&
      !originalRequest._retryNetwork
    ) {
      originalRequest._retryNetwork = true;
      console.log("Network error → retrying in 2s");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;

// ---------------------------------------------------------
// 📌 API ENDPOINTS
// ---------------------------------------------------------

// AUTH
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
};

// USERS ✅ (AVEC UPDATE AJOUTÉ)
export const usersAPI = {
  search: (query = "", teamId = null) =>
    api.get("/users/search", { params: { q: query, teamId } }),

  getUser: (id) => api.get(`/users/${id}`),

  getAll: () => api.get("/users"),

  create: (data) => api.post("/users", data),

  // ✅ MODIFIER INFOS UTILISATEUR (ADMIN)
  update: (id, data) => api.put(`/users/${id}`, data),

  updateRole: (id, data) => api.put(`/users/${id}/role`, data),

  delete: (id) => api.delete(`/users/${id}`),
};

// TEAMS
export const teamsAPI = {
  getAll: () => api.get("/teams"),
  getOne: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post("/teams", data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),

  addMember: (id, userId) => api.post(`/teams/${id}/members`, { userId }),
  removeMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`),
};

// PROJECTS
export const projectsAPI = {
  getAll: (params) => api.get("/projects", { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// TASKS
export const tasksAPI = {
  getAll: (params) => api.get("/tasks", { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),

  addSubtask: (id, title) => api.post(`/tasks/${id}/subtasks`, { title }),
  toggleSubtask: (id, subtaskId) =>
    api.put(`/tasks/${id}/subtasks/${subtaskId}`),

  uploadAttachment: (id, formData) =>
    api.post(`/tasks/${id}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getOverdue: () => api.get("/tasks/overdue"),
};

// COMMENTS
export const commentsAPI = {
  getForTask: (taskId) => api.get(`/comments/task/${taskId}`),
  create: (data) => api.post("/comments", data),
  update: (id, content) => api.put(`/comments/${id}`, { content }),
  delete: (id) => api.delete(`/comments/${id}`),
};

// NOTIFICATIONS
export const notificationsAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// HISTORY
export const historyAPI = {
  getProjectHistory: (projectId, limit) =>
    api.get(`/history/project/${projectId}`, { params: { limit } }),
  getUserHistory: (limit) =>
    api.get("/history/user", { params: { limit } }),
  getEntityHistory: (entityType, entityId, limit) =>
    api.get(`/history/${entityType}/${entityId}`, {
      params: { limit },
    }),
};

// ---------------------------------------------------------
// ✅ USEFUL LINKS (AJOUT : UPDATE ✔️)
// ---------------------------------------------------------
export const usefulLinksAPI = {
  getAll: () => api.get("/useful-links"),
  create: (data) => api.post("/useful-links", data),
  update: (id, data) => api.put(`/useful-links/${id}`, data),
  delete: (id) => api.delete(`/useful-links/${id}`),
};
