import { createContext, useContext, useState } from "react";
import { authAPI } from "../utils/api";
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(
   JSON.parse(localStorage.getItem("user")) || null
 );
 const login = async (email, password) => {
   try {
     const res = await authAPI.login({ email, password });
     localStorage.setItem("token", res.data.token);
     localStorage.setItem("user", JSON.stringify(res.data.data));
     setUser(res.data.data);
     return true;
   } catch (err) {
     alert("Identifiants invalides");
     return false;
   }
 };
 const register = async (data) => {
   try {
     const res = await authAPI.register(data);
     localStorage.setItem("token", res.data.token);
     localStorage.setItem("user", JSON.stringify(res.data.data));
     setUser(res.data.data);
     return true;
   } catch (err) {
     alert("Erreur lors de l'inscription");
     return false;
   }
 };
 const logout = () => {
   localStorage.removeItem("token");
   localStorage.removeItem("user");
   setUser(null);
   window.location.href = "/login";
 };
 return (
<AuthContext.Provider value={{ user, login, register, logout }}>
     {children}
</AuthContext.Provider>
 );
};
export const useAuth = () => useContext(AuthContext);
