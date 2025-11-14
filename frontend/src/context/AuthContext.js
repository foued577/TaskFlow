import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 🔥 Fonction REGISTER AJOUTÉE
  const register = async (data) => {
    try {
      const res = await authAPI.register(data);

      // On sauvegarde l’utilisateur
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.data));
      setUser(res.data.data);

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const login = async (data) => {
    try {
      const res = await authAPI.login(data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.data));
      setUser(res.data.data);

      return true;
    } catch (err) {
      console.error(err);
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
    if (localStorage.getItem("token")) {
      fetchMe();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
