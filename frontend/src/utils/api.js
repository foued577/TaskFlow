import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401, logout
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // If 503 (Service Unavailable - DB reconnecting), retry after delay
    if (error.response?.status === 503 && !originalRequest._retry) {
      originalRequest._retry = true;
      const retryAfter = error.response.data?.retryAfter || 3;
      
      console.log(`⚠️ Service unavailable, retrying in ${retryAfter}s...`);
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return api(originalRequest);
    }

    // If network error or timeout, retry once after 2s
    if ((error.code === 'ECONNABORTED' || error.message === 'Network Error') && !originalRequest._retryNetwork) {
      originalRequest._retryNetwork = true;
      console.log('⚠️ Network error, retrying in 2s...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Users API
export const usersAPI = {
  search: (query, teamId) => api.get('/users/search', { params: { q: query, teamId } }),
  getUser: (id) => api.get(`/users/${id}`),
};

// Teams API
export const teamsAPI = {
  getAll: () => api.get('/teams'),
  getOne: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  addMember: (id, userId) => api.post(`/teams/${id}/members`, { userId }),
  removeMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`),
};

// Projects API
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Tasks API
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  addSubtask: (id, title) => api.post(`/tasks/${id}/subtasks`, { title }),
  toggleSubtask: (id, subtaskId) => api.put(`/tasks/${id}/subtasks/${subtaskId}`),
  uploadAttachment: (id, formData) => api.post(`/tasks/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getOverdue: () => api.get('/tasks/overdue'),
};

// Comments API
export const commentsAPI = {
  getForTask: (taskId) => api.get(`/comments/task/${taskId}`),
  create: (data) => api.post('/comments', data),
  update: (id, content) => api.put(`/comments/${id}`, { content }),
  delete: (id) => api.delete(`/comments/${id}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// History API
export const historyAPI = {
  getProjectHistory: (projectId, limit) => api.get(`/history/project/${projectId}`, { params: { limit } }),
  getUserHistory: (limit) => api.get('/history/user', { params: { limit } }),
  getEntityHistory: (entityType, entityId, limit) => api.get(`/history/${entityType}/${entityId}`, { params: { limit } }),
};
