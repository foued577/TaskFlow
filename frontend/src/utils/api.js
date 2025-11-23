import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://taskflow-8g7v.onrender.com/api",
});

// 🔐 Ajouter le token automatiquement
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ----------------------------------------------------
   🔹 AUTH
-----------------------------------------------------*/
export const authAPI = {
  login: (data) => API.post("/auth/login", data),
  register: (data) => API.post("/auth/register", data),
  getMe: () => API.get("/auth/me"),
};

/* ----------------------------------------------------
   🔹 USERS (Admin seulement)
-----------------------------------------------------*/
export const usersAPI = {
  getAll: () => API.get("/users"),
  getOne: (id) => API.get(`/users/${id}`),
  create: (data) => API.post("/users", data),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
  search: (query) => API.get(`/users?search=${query}`),
};

/* ----------------------------------------------------
   🔹 TEAMS
-----------------------------------------------------*/
export const teamsAPI = {
  getAll: () => API.get("/teams"),
  getOne: (id) => API.get(`/teams/${id}`),
  create: (data) => API.post("/teams", data),
  update: (id, data) => API.put(`/teams/${id}`, data),

  addMember: (teamId, userId) =>
    API.post(`/teams/${teamId}/members`, { userId }),

  removeMember: (teamId, userId) =>
    API.delete(`/teams/${teamId}/members/${userId}`),
};

/* ----------------------------------------------------
   🔹 PROJECTS
-----------------------------------------------------*/
export const projectsAPI = {
  getAll: () => API.get("/projects"),
  getOne: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post("/projects", data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
};

/* ----------------------------------------------------
   🔹 TASKS
-----------------------------------------------------*/
export const tasksAPI = {
  getAll: () => API.get("/tasks"),
  getOne: (id) => API.get(`/tasks/${id}`),
  create: (data) => API.post("/tasks", data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`),

  addSubtask: (id, data) => API.post(`/tasks/${id}/subtasks`, data),
  toggleSubtask: (id, subId) =>
    API.put(`/tasks/${id}/subtasks/${subId}`),

  uploadAttachment: (id, file) =>
    API.post(`/tasks/${id}/attachments`, file, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getOverdue: () => API.get("/tasks/overdue"),
};

/* ----------------------------------------------------
   🔹 NOTIFICATIONS (déjà corrigé)
-----------------------------------------------------*/
export const notificationsAPI = {
  getAll: () => API.get("/notifications"),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  markAllAsRead: () => API.put("/notifications/read-all"),
  delete: (id) => API.delete(`/notifications/${id}`),
};

/* ----------------------------------------------------
   🔹 COMMENTS (manquait → causait erreur)
-----------------------------------------------------*/
export const commentsAPI = {
  getTaskComments: (taskId) => API.get(`/comments/${taskId}`),
  addComment: (taskId, data) => API.post(`/comments/${taskId}`, data),
  deleteComment: (taskId, commentId) =>
    API.delete(`/comments/${taskId}/${commentId}`),
};

/* ----------------------------------------------------
   🔹 HISTORY (manquait → causait erreur)
-----------------------------------------------------*/
export const historyAPI = {
  getAll: () => API.get("/history"),
};
