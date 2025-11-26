// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../utils/api";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 🌟 Beaucoup plus stable : on stocke user + token dans le state
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------------
  // 🔄 Rechargement du user après refresh ou ouverture de page
  // -----------------------------------------------------------
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await authAPI.getMe();
        const fetchedUser = res.data.data;

        // Compatibilité anciens users
        if (!fetchedUser.role) {
          fetchedUser.role = "admin";
        }

        setUser(fetchedUser);
        localStorage.setItem("user", JSON.stringify(fetchedUser));
      } catch (err) {
        console.error("Auth load error:", err);

        // Token invalide → logout propre
        if (err.response?.status === 401) {
          logout();
        }
      }

      setLoading(false);
    };

    loadUser();
  }, [token]); // ⭐ Le token est CRITIQUE ici

  // -----------------------------------------------------------
  // 🟢 LOGIN
  // -----------------------------------------------------------
  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });

      const token = res.data.data.token;
      const loggedUser = res.data.data.user;

      // Compatibilité rôles
      loggedUser.role = loggedUser.role || "admin";

      // Stockage local
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedUser));

      // Mise à jour des states (IMPORTANT)
      setToken(token);      // ⭐ obligatoire sinon login ne marche pas
      setUser(loggedUser);

      toast.success(`Bienvenue ${loggedUser.firstName} !`);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.response?.data?.message || "Identifiants incorrects");
      return false;
    }
  };

  // -----------------------------------------------------------
  // 🟢 REGISTER
  // -----------------------------------------------------------
  const register = async (data) => {
    try {
      const res = await authAPI.register(data);

      const token = res.data.data.token;
      const newUser = res.data.data.user;

      // Les nouveaux comptes sont toujours "member"
      newUser.role = "member";

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(newUser));

      setToken(token);
      setUser(newUser);

      toast.success("Compte créé avec succès !");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur inscription");
      return false;
    }
  };

  // -----------------------------------------------------------
  // 🔵 LOGOUT
  // -----------------------------------------------------------
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    window.location.href = "/login";
  };

  // -----------------------------------------------------------
  // 🟢 Mise à jour du profil
  // -----------------------------------------------------------
  const updateUser = (updatedUser) => {
    updatedUser.role = updatedUser.role || user?.role || "admin";

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
