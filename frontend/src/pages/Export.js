import React, { useState, useEffect } from 'react';
import { projectsAPI, teamsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { 
  FileDown, 
  FileSpreadsheet, 
  Calendar as CalendarIcon,
  Filter,
  Users,
  FolderKanban,
  BarChart3,
  Clock
} from 'lucide-react';
import Loading from '../components/Loading';

const Export = () => {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  const [filters, setFilters] = useState({
    projectId: '',
    status: '',
    priority: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, teamsRes] = await Promise.all([
        projectsAPI.getAll(),
        teamsAPI.getAll()
      ]);
      setProjects(projectsRes.data.data);
      setTeams(teamsRes.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (endpoint, filename) => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Build query string
      const params = new URLSearchParams();
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/export/${endpoint}${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${filename}_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Export réussi ! 📥');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const handleExportTeam = async (teamId) => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/export/team/${teamId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `rapport_equipe_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Rapport d\'équipe exporté ! 📥');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Loading fullScreen={false} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exports Excel</h1>
          <p className="text-gray-600 mt-1">Exportez vos données et statistiques en format Excel</p>
        </div>
        <FileSpreadsheet className="w-12 h-12 text-green-600" />
      </div>

      {/* Filters Section */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 mr-2 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtres (pour export des tâches)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Projet</label>
            <select
              value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
              className="input"
            >
              <option value="">Tous les projets</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input"
            >
              <option value="">Tous les statuts</option>
              <option value="not_started">Non démarrée</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="input"
            >
              <option value="">Toutes les priorités</option>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <button
          onClick={() => setFilters({ projectId: '', status: '', priority: '', startDate: '', endDate: '' })}
          className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Réinitialiser les filtres
        </button>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Export Tasks */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <FileDown className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Export des Tâches</h3>
              <p className="text-sm text-gray-600">Toutes les tâches avec filtres</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Exporte toutes les tâches avec leurs détails : statut, priorité, assignations, sous-tâches, progression, etc.
          </p>
          <button
            onClick={() => handleExport('tasks', 'taches')}
            disabled={exporting}
            className="w-full btn btn-primary flex items-center justify-center"
          >
            <FileDown className="w-5 h-5 mr-2" />
            {exporting ? 'Export en cours...' : 'Exporter les Tâches'}
          </button>
        </div>

        {/* Export Projects */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <FolderKanban className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Export des Projets</h3>
              <p className="text-sm text-gray-600">Statistiques par projet</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Exporte tous les projets avec statistiques : tâches totales, terminées, en cours, en retard, taux de complétion.
          </p>
          <button
            onClick={() => handleExport('projects', 'projets')}
            disabled={exporting}
            className="w-full btn btn-primary flex items-center justify-center"
          >
            <FileDown className="w-5 h-5 mr-2" />
            {exporting ? 'Export en cours...' : 'Exporter les Projets'}
          </button>
        </div>

        {/* Export Statistics */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Statistiques Globales</h3>
              <p className="text-sm text-gray-600">Vue d'ensemble complète</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Rapport complet avec statistiques globales, par priorité, et par projet (plusieurs onglets).
          </p>
          <button
            onClick={() => handleExport('statistics', 'statistiques')}
            disabled={exporting}
            className="w-full btn btn-primary flex items-center justify-center"
          >
            <FileDown className="w-5 h-5 mr-2" />
            {exporting ? 'Export en cours...' : 'Exporter les Stats'}
          </button>
        </div>

        {/* Export History */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Historique des Actions</h3>
              <p className="text-sm text-gray-600">Journal d'activité</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Exporte l'historique complet des actions : créations, modifications, suppressions (limité à 1000 dernières).
          </p>
          <button
            onClick={() => handleExport('history', 'historique')}
            disabled={exporting}
            className="w-full btn btn-primary flex items-center justify-center"
          >
            <FileDown className="w-5 h-5 mr-2" />
            {exporting ? 'Export en cours...' : 'Exporter l\'Historique'}
          </button>
        </div>
      </div>

      {/* Team Reports */}
      {teams.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 mr-2 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Rapports par Équipe</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-600">
                        {team.members.length} membre{team.members.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleExportTeam(team._id)}
                  disabled={exporting}
                  className="w-full btn btn-secondary text-sm flex items-center justify-center"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Exporter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="card mt-8 bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">À propos des exports</h3>
            <div className="mt-2 text-sm text-blue-800">
              <ul className="list-disc list-inside space-y-1">
                <li>Les fichiers sont générés au format Excel (.xlsx)</li>
                <li>Les exports incluent toutes les données accessibles à votre compte</li>
                <li>Les filtres s'appliquent uniquement à l'export des tâches</li>
                <li>Les statistiques incluent plusieurs onglets avec différentes vues</li>
                <li>Les exports sont générés en temps réel avec les données actuelles</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Export;
