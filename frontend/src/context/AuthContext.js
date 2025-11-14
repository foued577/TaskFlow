import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored || stored === "undefined") return null;
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const login = (data) => {
    localStorage.setItem("token", data.token);

    // Toujours sauvegarder un JSON valide
    localStorage.setItem("user", JSON.stringify(data.user || data.data));

    setUser(data.user || data.data);
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
    const token = localStorage.getItem("token");

    // Si le user est corrompu → reset
    const storedUser = localStorage.getItem("user");
    if (storedUser === "undefined") {
      localStorage.removeItem("user");
      setUser(null);
    }

    if (token) fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
