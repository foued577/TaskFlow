import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  // ✅ LOGIN QUI APPELLE L’API CORRECTEMENT
  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.data));
      setUser(res.data.data);

      return true;
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erreur de connexion");
      return false;
    }
  };

  // ✅ REGISTER QUI APPELLE L’API CORRECTEMENT
  const register = async (form) => {
    try {
      const res = await authAPI.register(form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.data));
      setUser(res.data.data);

      return true;
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erreur lors de l'inscription");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  const updateUser = (data) => {
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

  const fetchMe = async () => {
    try {
      const res = await authAPI.getMe();
      updateUser(res.data.data);
    } catch {
      logout();
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
