import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Sécurise le JSON.parse pour éviter les crash
  const safeUser = () => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(safeUser);

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.data));
    setUser(data.data);
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
    } catch (err) {
      logout();
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
