import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || "https://taskflow-1-jwh1.onrender.com/api";
const api = axios.create({
 baseURL: API_URL,
 headers: { "Content-Type": "application/json" }
});
api.interceptors.request.use(config => {
 const token = localStorage.getItem("token");
 if (token) config.headers.Authorization = `Bearer ${token}`;
 return config;
});
export default api;
export const authAPI = {
 login: (data) => api.post("/auth/login", data),
 register: (data) => api.post("/auth/register", data),
 getMe: () => api.get("/auth/me"),
};
