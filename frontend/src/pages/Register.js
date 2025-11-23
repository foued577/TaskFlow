import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { UserPlus, Mail, Lock, User, Shield, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'member', // admin choisit : admin | member
  });

  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  // Si pas connecté ou pas admin → redirection / message
  useEffect(() => {
    if (!user) {
      // pas connecté → on renvoie vers la page de login
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error("Vous n'avez pas les droits pour créer un utilisateur");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      // On appelle directement l’API, sans passer par AuthContext.register
      await authAPI.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role, // admin ou member
      });

      toast.success('Utilisateur créé avec succès ✅');

      // On nettoie le formulaire, mais on garde l’admin connecté
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'member',
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la création de l'utilisateur"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accès réservé
            </h1>
            <p className="text-gray-600">
              Seuls les administrateurs peuvent créer de nouveaux utilisateurs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TaskFlow</h1>
            <p className="text-gray-600">
              Créer un <span className="font-semibold">nouvel utilisateur</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Vous êtes connecté en tant qu&apos;administrateur
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Prénom"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="utilisateur@email.com"
                  required
                />
              </div>
            </div>

            {/* Choix du rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-1 text-gray-500" />
                Rôle de l&apos;utilisateur
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="member"
                    checked={formData.role === 'member'}
                    onChange={handleChange}
                  />
                  <span className="text-sm text-gray-700">Membre</span>
                </label>
                <label className="flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={handleChange}
                  />
                  <span className="text-sm text-gray-700">Administrateur</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Le rôle &quot;Administrateur&quot; donne accès complet à la
                gestion des utilisateurs, projets, équipes et tâches.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Créer l&apos;utilisateur
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
