import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://taskflow-backend.onrender.com/api";

// Axios instance with token
export const api = axios.create({
  baseURL: API_URL,
});

// Automatically attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// -------- AUTH ----------
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  getMe: () => api.get("/auth/me"),
};

// -------- USERS ----------
export const usersAPI = {
  getAll: () => api.get("/users"),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// -------- TEAMS ----------
export const teamsAPI = {
  getAll: () => api.get("/teams"),
  getOne: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post("/teams", data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  addMember: (teamId, data) => api.post(`/teams/${teamId}/members`, data),
  removeMember: (teamId, userId) =>
    api.delete(`/teams/${teamId}/members/${userId}`),
};

// -------- PROJECTS ----------
export const projectsAPI = {
  getAll: () => api.get("/projects"),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// -------- TASKS ----------
export const tasksAPI = {
  getAll: (params) => api.get("/tasks", { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  getOverdue: () => api.get("/tasks/overdue"),
};

// -------- COMMENTS (MANQUAIT !) ----------
export const commentsAPI = {
  create: (taskId, data) => api.post(`/tasks/${taskId}/comments`, data),
  getAll: (taskId) => api.get(`/tasks/${taskId}/comments`),
  delete: (taskId, commentId) =>
    api.delete(`/tasks/${taskId}/comments/${commentId}`),
};

// -------- NOTIFICATIONS ----------
export const notificationsAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
  delete: (id) => api.delete(`/notifications/${id}`),
};
