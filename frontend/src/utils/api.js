import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Création instance Axios qui ajoute automatiquement le token
const api = axios.create({
  baseURL: API_URL,
});

// Intercepteur → Ajoute token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ======================
// AUTH
// ======================
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),

  // RESERVE ADMIN → créer un utilisateur
  createUserByAdmin: (data) => api.post("/auth/register", data),
};

// ======================
// USERS
// ======================
export const usersAPI = {
  search: (query, teamId = "") =>
    api.get("/users/search", { params: { q: query, teamId } }),

  getById: (id) => api.get(`/users/${id}`),
};

// ======================
// TEAMS
// ======================
export const teamsAPI = {
  getAll: () => api.get("/teams"),
  create: (data) => api.post("/teams", data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  addMember: (teamId, userId) =>
    api.post(`/teams/${teamId}/members`, { userId }),
  removeMember: (teamId, userId) =>
    api.delete(`/teams/${teamId}/members/${userId}`),
};

// ======================
// PROJECTS
// ======================
export const projectsAPI = {
  getAll: () => api.get("/projects"),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// ======================
// TASKS
// ======================
export const tasksAPI = {
  getAll: (filters = {}) => api.get("/tasks", { params: filters }),
  getOverdue: () => api.get("/tasks/overdue"),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// ======================
// EXPORTS (Excel)
// ======================
export const exportAPI = {
  tasks: () => api.get("/export/tasks", { responseType: "blob" }),
  projects: () => api.get("/export/projects", { responseType: "blob" }),
  statistics: () => api.get("/export/statistics", { responseType: "blob" }),
  teamReport: (teamId) =>
    api.get(`/export/team/${teamId}`, { responseType: "blob" }),
  history: () => api.get("/export/history", { responseType: "blob" }),
};
