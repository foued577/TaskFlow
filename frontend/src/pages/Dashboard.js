import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 👈 ajout du hook pour la redirection
import { useAuth } from '../context/AuthContext';
import { tasksAPI, projectsAPI, teamsAPI } from '../utils/api';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  FolderKanban,
  Calendar as CalendarIcon,
} from 'lucide-react';
import Loading from '../components/Loading';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // 👈 pour naviguer vers les pages
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [tasksRes, projectsRes, teamsRes, overdueRes] = await Promise.all([
        tasksAPI.getAll(),
        projectsAPI.getAll(),
        teamsAPI.getAll(),
        tasksAPI.getOverdue(),
      ]);

      const tasks = tasksRes.data.data;
      setStats({
        totalTasks: tasks.length,
        inProgress: tasks.filter((t) => t.status === 'in_progress').length,
        completed: tasks.filter((t) => t.status === 'completed').length,
        overdue: overdueRes.data.count,
      });

      setRecentTasks(tasks.slice(0, 5));
      setProjects(projectsRes.data.data.slice(0, 4));
      setTeams(teamsRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || colors.not_started;
  };

  // 👇 Fonction pour rediriger vers la page des tâches avec un filtre
  const handleRedirect = (filter) => {
    if (filter === 'all') navigate('/tasks');
    else navigate(`/tasks?status=${filter}`);
  };

  if (loading) return <Loading fullScreen={false} />;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Bienvenue, {user?.firstName} ! 👋
        </h1>
        <p className="text-primary-100">
          Voici un aperçu de vos tâches et projets en cours
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ✅ Tâches totales */}
        <div
          onClick={() => handleRedirect('all')}
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tâches totales</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* ✅ En cours */}
        <div
          onClick={() => handleRedirect('in_progress')}
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En cours</p>
              <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* ✅ Terminées */}
        <div
          onClick={() => handleRedirect('completed')}
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Terminées</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* ✅ En retard */}
        <div
          onClick={() => handleRedirect('overdue')}
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En retard</p>
              <p className="text-3xl font-bold text-gray-900">{stats.overdue}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* === reste du tableau de bord identique === */}
      {/* Tâches récentes, projets, équipes (inchangés) */}
      {/* ... ton code actuel ... */}
    </div>
  );
};

export default Dashboard;
