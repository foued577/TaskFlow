import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load user:', error);
      
      // Ne déconnecter que si le token est vraiment invalide (401)
      // Pas pour les erreurs de réseau ou serveur
      if (error.response?.status === 401) {
        console.log('Token invalide, déconnexion...');
        logout();
      } else {
        console.log('Erreur temporaire, conservation de la session...');
        // Essayer de charger l'utilisateur depuis localStorage en backup
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
            
            // Réessayer la connexion après 3 secondes si c'est un problème réseau
            if (retryCount < 2) {
              console.log(`Nouvelle tentative de connexion dans 3s... (${retryCount + 1}/2)`);
              setTimeout(() => {
                setRetryCount(retryCount + 1);
                loadUser();
              }, 3000);
            } else {
              console.log('Nombre maximum de tentatives atteint, utilisation des données en cache');
              setRetryCount(0);
            }
          } catch (e) {
            console.error('Failed to parse saved user');
          }
        }
      }
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      toast.success(`Bienvenue, ${user.firstName}!`);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur de connexion');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      toast.success('Compte créé avec succès!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.info('Déconnecté');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
