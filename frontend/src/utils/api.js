import axios from "axios";

// ---------------------------------------------------------

// AUTO-DETECT ENVIRONMENT

// ---------------------------------------------------------

const API_URL =

  process.env.REACT_APP_API_URL ||

  (window.location.hostname.includes("onrender.com")

    ? "https://taskflow-1-jwh1.onrender.com/api"

    : "http://localhost:5000/api");

// ---------------------------------------------------------

// Axios instance

// ---------------------------------------------------------

const api = axios.create({

  baseURL: API_URL,

  headers: {

    "Content-Type": "application/json",

  },

  timeout: 15000,

});

// ---------------------------------------------------------

// Add JWT to headers

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

// Error handling

// ---------------------------------------------------------

api.interceptors.response.use(

  (response) => response,

  async (error) => {

    const originalRequest = error.config;

    if (error.response?.status === 401) {

      localStorage.removeItem("token");

      localStorage.removeItem("user");

      window.location.href = "/login";

      return Promise.reject(error);

    }

    return Promise.reject(error);

  }

);

export default api;

// =====================================================

// AUTH ENDPOINTS

// =====================================================

export const authAPI = {

  register: (data) => api.post("/auth/register", data),

  login: (data) => api.post("/auth/login", data),

  getMe: () => api.get("/auth/me"),

  updateProfile: (data) => api.put("/auth/profile", data),

};

// =====================================================

// USERS ENDPOINTS (ADMIN)

// =====================================================

export const usersAPI = {

  search: (query, teamId) =>

    api.get("/users/search", { params: { q: query, teamId } }),

  getUser: (id) => api.get(`/users/${id}`),

  // 🔥 NEW: Create a new user

  create: (data) => api.post("/users", data),

  // 🔥 NEW: Update user role

  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),

  // 🔥 NEW: Delete user

  delete: (id) => api.delete(`/users/${id}`),

  // 🔥 Get all users (for admin table)

  getAll: () => api.get("/users"),

};

// =====================================================

// TEAMS / PROJECTS / TASKS / COMMENTS / NOTIFS / HISTORY

// (inchangés → on garde le reste comme avant)

// =====================================================
Cloud Application Platform | Render
On Render, you can build, deploy, and scale your apps with unparalleled ease – from your first user to your billionth.
