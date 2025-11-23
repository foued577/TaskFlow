import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Ajouter automatiquement le token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ------------------ AUTH ------------------
export const authAPI = {
  login: (data) => API.post("/auth/login", data),
  register: (data) => API.post("/auth/register", data),
  getMe: () => API.get("/auth/me"),
};

// ------------------ USERS ------------------
export const usersAPI = {
  getAll: () => API.get("/users"),
  getOne: (id) => API.get(`/users/${id}`),
  create: (data) => API.post("/users", data),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
};

// ------------------ TEAMS ------------------
export const teamsAPI = {
  getAll: () => API.get("/teams"),
  getOne: (id) => API.get(`/teams/${id}`),
  create: (data) => API.post("/teams", data),
  update: (id, data) => API.put(`/teams/${id}`, data),
  addMember: (id, data) => API.post(`/teams/${id}/members`, data),
  removeMember: (teamId, userId) => API.delete(`/teams/${teamId}/members/${userId}`),
};

// ------------------ PROJECTS ------------------
export const projectsAPI = {
  getAll: () => API.get("/projects"),
  getOne: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post("/projects", data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
};

// ------------------ TASKS ------------------
export const tasksAPI = {
  getAll: () => API.get("/tasks"),
  getOne: (id) => API.get(`/tasks/${id}`),
  create: (data) => API.post("/tasks", data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
  addSubtask: (id, data) => API.post(`/tasks/${id}/subtasks`, data),
  toggleSubtask: (id, subtaskId) =>
    API.put(`/tasks/${id}/subtasks/${subtaskId}`),
  uploadAttachment: (id, data) =>
    API.post(`/tasks/${id}/attachments`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getOverdue: () => API.get("/tasks/overdue"),
};

// ------------------ NOTIFICATIONS (AJOUT COMPLET) ------------------
export const notificationsAPI = {
  getAll: (params) => API.get("/notifications", { params }),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  markAllAsRead: () => API.put("/notifications/read-all"),
  delete: (id) => API.delete(`/notifications/${id}`),
};
