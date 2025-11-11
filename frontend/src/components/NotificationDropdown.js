import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { notificationsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const NotificationDropdown = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // ✅ LOAD NOTIFICATIONS (réutilisé partout)
  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll({ limit: 20 });
      setNotifications(response.data.data);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // ✅ Rafraîchissement automatique toutes les 10 secondes
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // ✅ Recharger quand une nouvelle notification arrive via Socket.io
  useEffect(() => {
    if (trigger > 0) {
      loadNotifications();
    }
  }, [trigger]);

  // ✅ Fermer lorsqu’on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      loadNotifications();
    } catch (error) {
      toast.error('Erreur lors du marquage de la notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      loadNotifications();
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      toast.error('Erreur lors du marquage des notifications');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsAPI.delete(id);
      loadNotifications();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      task_assigned: '📋',
      task_updated: '✏️',
      task_overdue: '⚠️',
      comment_added: '💬',
      mention: '👤',
      team_added: '👥',
      project_added: '📁',
    };
    return icons[type] || '📢';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Liste */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[500px] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Tout marquer
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !n.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-lg mr-2">{getNotificationIcon(n.type)}</span>
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{n.message}</p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 ml-2">
                        {!n.isRead && (
                          <button
                            onClick={() => markAsRead(n._id)}
                            className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                            title="Marquer comme lu"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
