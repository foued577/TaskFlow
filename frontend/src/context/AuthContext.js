import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur si token existe
  useEffect(() => {
    if (token) loadUser();
    else setLoading(false);
  }, [token]);

  const loadUser = async () => {
    try {
      const res = await authAPI.getMe();
      setUser(res.data.data);
      localStorage.setItem('user', JSON.stringify(res.data.data));
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      }
    }
    setLoading(false);
  };

  // Connexion
  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      const { user, token } = res.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);

      toast.success(`Bienvenue ${user.firstName}!`);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
      return false;
    }
  };

  // Création d'utilisateur (réservé admin)
  const registerUser = async (data) => {
    try {
      const res = await authAPI.createUserByAdmin(data);
      toast.success('Utilisateur créé avec succès');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la création");
      return false;
    }
  };

  // Mise à jour du profil
  const updateUser = (newUser) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.info('Déconnecté');
  };

  const value = {
    user,
    token,
    loading,
    login,
    registerUser, // admin only
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin"
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
