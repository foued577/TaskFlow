import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../utils/api";
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(
   JSON.parse(localStorage.getItem("user")) || null
 );
 // LOGIN
 const login = async (email, password) => {
   try {
     const res = await authAPI.login({ email, password });
     localStorage.setItem("token", res.data.token);
     localStorage.setItem("user", JSON.stringify(res.data.data));
     setUser(res.data.data);
     return true;
   } catch (err) {
     console.error("LOGIN ERROR:", err);
     return false;
   }
 };
 // REGISTER
 const register = async (data) => {
   try {
     const res = await authAPI.register(data);
     localStorage.setItem("token", res.data.token);
     localStorage.setItem("user", JSON.stringify(res.data.data));
     setUser(res.data.data);
     return true;
   } catch (err) {
     console.error("REGISTER ERROR:", err);
     return false;
   }
 };
 const logout = () => {
   localStorage.removeItem("token");
   localStorage.removeItem("user");
   setUser(null);
   window.location.href = "/login";
 };
 const fetchMe = async () => {
   try {
     const res = await authAPI.getMe();
     setUser(res.data.data);
   } catch {
     logout();
   }
 };
 useEffect(() => {
   if (localStorage.getItem("token")) fetchMe();
 }, []);
 return (
<AuthContext.Provider value={{ user, login, register, logout }}>
     {children}
</AuthContext.Provider>
 );
};
export const useAuth = () => useContext(AuthContext);
