import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
        <div className="card hover:shadow-md transition-shadow">
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

        <div className="card hover:shadow-md transition-shadow">
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

        <div className="card hover:shadow-md transition-shadow">
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

        <div className="card hover:shadow-md transition-shadow">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Tâches récentes</h2>
            <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Voir tout
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucune tâche</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task._id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <span className={`badge ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`badge ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {task.dueDate && (
                      <span className="text-gray-500 flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatDistanceToNow(new Date(task.dueDate), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects & Teams */}
        <div className="space-y-6">
          {/* Projects */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Projets actifs</h2>
              <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Voir tout
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FolderKanban className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>Aucun projet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: project.color }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-500">{project.team?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teams */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Mes équipes</h2>
              <Link to="/teams" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Voir tout
              </Link>
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>Aucune équipe</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teams.slice(0, 4).map((team) => (
                  <div
                    key={team._id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold mr-3"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{team.name}</p>
                        <p className="text-xs text-gray-500">
                          {team.members.length} membre{team.members.length > 1 ? 's' : ''}
                        </p>
                      </div>
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

export default Dashboard;
