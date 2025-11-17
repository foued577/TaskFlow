import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(
   () => JSON.parse(localStorage.getItem('user')) || null
 );
 const [loading, setLoading] = useState(true);
 const login = async (email, password) => {
   try {
     const res = await authAPI.login({ email, password });
     const { token, data } = res.data;
     localStorage.setItem('token', token);
     localStorage.setItem('user', JSON.stringify(data));
     setUser(data);
     return true;
   } catch (err) {
     toast.error(err.response?.data?.message || "Erreur de connexion");
     return false;
   }
 };
 const register = async (data) => {
   try {
     const res = await authAPI.register(data);
     const { token, data: user } = res.data;
     localStorage.setItem('token', token);
     localStorage.setItem('user', JSON.stringify(user));
     setUser(user);
     return true;
   } catch (err) {
     toast.error(err.response?.data?.message || "Erreur d'inscription");
     return false;
   }
 };
 const logout = () => {
   localStorage.removeItem('token');
   localStorage.removeItem('user');
   setUser(null);
 };
 const fetchMe = async () => {
   try {
     const res = await authAPI.getMe();
     setUser(res.data.data);
   } catch {
     logout();
   } finally {
     setLoading(false);
   }
 };
 useEffect(() => {
   const token = localStorage.getItem("token");
   if (token) fetchMe();
   else setLoading(false);
 }, []);
 return (
<AuthContext.Provider value={{ user, login, register, logout }}>
     {!loading && children}
</AuthContext.Provider>
 );
};
