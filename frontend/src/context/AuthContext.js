import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  // 🔥 Correct login : email + password séparés
  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });

      const { token, data } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(data));

      setUser(data);
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  };

  const register = async (formData) => {
    try {
      const res = await authAPI.register(formData);
      const { token, data } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(data));

      setUser(data);
      return true;
    } catch (err) {
      console.error("Register failed:", err);
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
      localStorage.setItem("user", JSON.stringify(res.data.data));
      setUser(res.data.data);
    } catch (err) {
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
