import React, { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Loading from '../components/Loading';
import TaskModal from '../components/TaskModal';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        tasksAPI.getAll(),
        projectsAPI.getAll(),
      ]);
      setTasks(tasksRes.data.data);
      setProjects(projectsRes.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getTasksForDate = (date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), date);
    });
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="btn btn-secondary text-sm"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setSelectedTask(null);
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center ml-4"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle tâche
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    return (
      <div className="grid grid-cols-7 gap-px bg-gray-300 border border-gray-300 rounded-t-lg overflow-hidden">
        {days.map((day) => (
          <div key={day} className="bg-gray-50 p-3 text-center font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayTasks = getTasksForDate(day);
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            onClick={() => setSelectedDate(cloneDay)}
            className={`bg-white min-h-[120px] p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
              !isCurrentMonth ? 'bg-gray-100' : ''
            } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm font-semibold ${
                  !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                } ${isToday ? 'bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}
              >
                {format(day, 'd')}
              </span>
              {dayTasks.length > 0 && (
                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                  {dayTasks.length}
                </span>
              )}
            </div>
            
            <div className="space-y-1">
              {dayTasks.slice(0, 3).map((task) => (
                <div
                  key={task._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTask(task);
                    setShowModal(true);
                  }}
                  className="text-xs p-1 rounded truncate cursor-pointer hover:shadow-sm transition-shadow"
                  style={{
                    backgroundColor: task.project?.color + '20',
                    borderLeft: `3px solid ${task.project?.color || '#3B82F6'}`,
                  }}
                >
                  {task.title}
                </div>
              ))}
              {dayTasks.length > 3 && (
                <div className="text-xs text-gray-500 pl-1">
                  +{dayTasks.length - 3} autres
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-px bg-gray-300">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="border border-gray-300 rounded-b-lg overflow-hidden">{rows}</div>;
  };

  if (loading) return <Loading fullScreen={false} />;

  return (
    <div>
      {renderHeader()}
      
      <div className="card p-0 overflow-hidden">
        {renderDays()}
        {renderCells()}
      </div>

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={selectedTask}
          projects={projects}
          onClose={() => {
            setShowModal(false);
            setSelectedTask(null);
          }}
          onSave={() => {
            setShowModal(false);
            setSelectedTask(null);
            loadData();
          }}
        />
      )}

      {/* Date Detail Modal */}
      {selectedDate && !showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </h2>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {getTasksForDate(selectedDate).length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune tâche ce jour</p>
              ) : (
                getTasksForDate(selectedDate).map((task) => (
                  <div
                    key={task._id}
                    onClick={() => {
                      setSelectedDate(null);
                      setSelectedTask(task);
                      setShowModal(true);
                    }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{task.project?.name}</p>
                        {task.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                      <span
                        className={`badge ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full mt-6 btn btn-secondary"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
