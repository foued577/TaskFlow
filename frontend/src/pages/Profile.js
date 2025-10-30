import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, historyAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { User, Mail, Phone, FileText, Save, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data.data);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await historyAPI.getUserHistory(20);
      setHistory(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setHistoryLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      created: '➕',
      updated: '✏️',
      deleted: '🗑️',
      assigned: '👤',
      completed: '✅',
      commented: '💬',
      attached_file: '📎',
    };
    return icons[action] || '📝';
  };

  const getActionLabel = (action) => {
    const labels = {
      created: 'Créé',
      updated: 'Modifié',
      deleted: 'Supprimé',
      assigned: 'Assigné',
      completed: 'Terminé',
      commented: 'Commenté',
      attached_file: 'Fichier attaché',
    };
    return labels[action] || action;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon profil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600 mb-4">{user?.email}</p>

            {user?.teams && user.teams.length > 0 && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Équipes</p>
                <div className="space-y-2">
                  {user.teams.map((team) => (
                    <div
                      key={team._id}
                      className="flex items-center justify-center"
                    >
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="text-sm text-gray-700">{team.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user?.lastLogin && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-xs text-gray-500">
                  Dernière connexion : {format(new Date(user.lastLogin), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Modifier le profil</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Nom
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email}
                  className="input bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input"
                  rows={4}
                  maxLength={500}
                  placeholder="Quelques mots sur vous..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.bio.length}/500 caractères
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary flex items-center justify-center"
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>

          {/* Activity History */}
          <div className="card mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Activité récente
              </h3>
              {history.length === 0 && (
                <button
                  onClick={loadHistory}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Charger l'historique
                </button>
              )}
            </div>

            {historyLoading ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Cliquez sur "Charger l'historique" pour voir votre activité</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((item) => (
                  <div key={item._id} className="flex items-start p-3 border border-gray-200 rounded-lg">
                    <span className="text-2xl mr-3">{getActionIcon(item.action)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getActionLabel(item.action)} {item.entityType === 'task' ? 'la tâche' : 'le projet'}{' '}
                        <span className="font-bold">{item.entityName}</span>
                      </p>
                      {item.project && (
                        <p className="text-xs text-gray-600 mt-1">
                          Projet: {item.project.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(item.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
