import React, { useState, useEffect } from 'react';
import { projectsAPI, teamsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { FolderKanban, Plus, Edit2, Trash2, X, Calendar as CalendarIcon } from 'lucide-react';
import Loading from '../components/Loading';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamId: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    color: '#10B981',
    tags: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, teamsRes] = await Promise.all([
        projectsAPI.getAll(),
        teamsAPI.getAll(),
      ]);

      // ✅ Tri alphabétique A → Z
      const sortedProjects = projectsRes.data.data.sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
      );

      setProjects(sortedProjects);
      setTeams(teamsRes.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      };

      if (modalMode === 'create') {
        await projectsAPI.create(data);
        toast.success('Projet créé avec succès');
      } else {
        await projectsAPI.update(selectedProject._id, data);
        toast.success('Projet mis à jour');
      }

      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Une erreur est survenue');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      teamId: '',
      startDate: '',
      endDate: '',
      priority: 'medium',
      color: '#10B981',
      tags: '',
    });
  };

  const openCreateModal = () => {
    setModalMode('create');
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setModalMode('edit');
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      teamId: project.team._id,
      startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
      endDate: project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
      priority: project.priority,
      color: project.color,
      tags: project.tags?.join(', ') || '',
    });
    setShowModal(true);
  };

  const deleteProject = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce projet ?')) {
      try {
        await projectsAPI.delete(id);
        toast.success('Projet supprimé');
        loadData();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
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

  if (loading) return <Loading fullScreen={false} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
        <button onClick={openCreateModal} className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Nouveau projet
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet</h3>
          <p className="text-gray-600 mb-4">Créez votre premier projet</p>
          <button onClick={openCreateModal} className="btn btn-primary">
            Créer un projet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div
                    className="w-3 h-12 rounded-l-lg mr-3"
                    style={{ backgroundColor: project.color }}
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.team?.name}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteProject(project._id)}
                    className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center justify-between mb-3">
                <span className={`badge ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
                <span className={`badge ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
              </div>

              {(project.startDate || project.endDate) && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {project.startDate && format(new Date(project.startDate), 'dd MMM', { locale: fr })}
                    {project.startDate && project.endDate && ' - '}
                    {project.endDate && format(new Date(project.endDate), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>
              )}

              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {project.tags.map((tag, index) => (
                    <span key={index} className="badge bg-gray-100 text-gray-700 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === 'create' ? 'Nouveau projet' : 'Modifier le projet'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Les champs du formulaire restent identiques */}

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 btn btn-primary">
                  {modalMode === 'create' ? 'Créer' : 'Mettre à jour'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Annuler
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Projects;
