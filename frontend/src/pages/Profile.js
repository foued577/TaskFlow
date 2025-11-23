import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../utils/api";
import { toast } from "react-toastify";
import { User, Mail, Shield, Loader2, Save } from "lucide-react";

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile(formData);

      updateUser(response.data.data); // Mise à jour du contexte
      toast.success("Profil mis à jour avec succès !");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la mise à jour"
      );
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-6 mt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon profil</h1>

      <form onSubmit={saveProfile} className="space-y-6">

        {/* Prénom */}
        <div>
          <label className="block text-sm font-medium mb-2">Prénom</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
            <input
              type="text"
              name="firstName"
              className="input pl-10"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium mb-2">Nom</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
            <input
              type="text"
              name="lastName"
              className="input pl-10"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
            <input
              type="email"
              name="email"
              className="input pl-10"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Rôle */}
        <div>
          <label className="block text-sm font-medium mb-2">Rôle</label>
          <div className="input flex items-center gap-2 text-gray-700">
            <Shield className="w-5 h-5 text-gray-500" />
            {user?.role === "admin" ? "Administrateur" : "Membre"}
          </div>
        </div>

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Sauvegarder
            </>
          )}
        </button>

      </form>
    </div>
  );
};

export default Profile;
