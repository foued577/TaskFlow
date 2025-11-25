import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // -------------------------------
  // 🔄 Charger l'utilisateur via /auth/me
  // -------------------------------
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await authAPI.getMe();
        let fetchedUser = res.data.data;

        // Si l'utilisateur n'a pas de rôle → admin par défaut
        if (!fetchedUser.role) {
          fetchedUser.role = "admin";
        }

        setUser(fetchedUser);
        localStorage.setItem("user", JSON.stringify(fetchedUser));
      } catch (err) {
        console.error("Auth load error:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  // -------------------------------
  // 🟢 Login
  // -------------------------------
  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });

      const token = res.data.data.token;
      let loggedUser = res.data.data.user;

      localStorage.setItem("token", token);

      // Rôle correct
      loggedUser.role = loggedUser.role || "admin";

      setUser(loggedUser);
      localStorage.setItem("user", JSON.stringify(loggedUser));

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  // -------------------------------
  // 🟢 Register
  // -------------------------------
  const register = async (data) => {
    try {
      const res = await authAPI.register(data);

      const token = res.data.data.token;
      let newUser = res.data.data.user;

      localStorage.setItem("token", token);

      // Nouvelle inscription → MEMBER
      newUser.role = "member";

      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));

      return true;
    } catch (error) {
      console.error("Register failed:", error);
      return false;
    }
  };

  // -------------------------------
  // 🟢 Logout
  // -------------------------------
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  // -------------------------------
  // 🟢 Mise à jour du profil
  // -------------------------------
  const updateUser = (updatedUser) => {
    // Rôle toujours conservé (admin si ancien user)
    updatedUser.role = updatedUser.role || user?.role || "admin";

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
