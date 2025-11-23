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

// Intercepteur de réponse pour gérer les erreurs
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("Erreur API:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
      
      // Si erreur 401, rediriger vers login
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    } else if (error.request) {
      console.error("Pas de réponse du serveur:", error.request);
    } else {
      console.error("Erreur de configuration:", error.message);
    }
    return Promise.reject(error);
  }
);

/* ----------------------------------------------------
   🔹 AUTH
-----------------------------------------------------*/
export const authAPI = {
  login: (data) => API.post("/auth/login", data),
  register: (data) => API.post("/auth/register", data),
  getMe: () => API.get("/auth/me"),
  updateProfile: (data) => API.put("/auth/update-profile", data),
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
   🔹 NOTIFICATIONS
-----------------------------------------------------*/
export const notificationsAPI = {
  getAll: () => API.get("/notifications"),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  markAllAsRead: () => API.put("/notifications/read-all"),
  delete: (id) => API.delete(`/notifications/${id}`),
};

/* ----------------------------------------------------
   🔹 COMMENTS
-----------------------------------------------------*/
export const commentsAPI = {
  getTaskComments: (taskId) => API.get(`/comments/${taskId}`),
  addComment: (taskId, data) => API.post("/comments", { taskId, ...data }),
  updateComment: (id, data) => API.put(`/comments/${id}`, data),
  deleteComment: (id) => API.delete(`/comments/${id}`),
};

/* ----------------------------------------------------
   🔹 HISTORY
-----------------------------------------------------*/
export const historyAPI = {
  getAll: () => API.get("/history/user"),
  getProjectHistory: (projectId) => API.get(`/history/project/${projectId}`),
  getEntityHistory: (entityType, entityId) => 
    API.get(`/history/${entityType}/${entityId}`),
};
