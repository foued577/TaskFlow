// 🚀 OPTION A4 — NotificationDropdown.js (FIABILISÉ)

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { notificationsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const NotificationDropdown = () => {
const [isOpen, setIsOpen] = useState(false);
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const dropdownRef = useRef(null);

let retryCount = 0;

// 📌 Chargement robuste
const loadNotifications = async (isRetry = false) => {
try {
const res = await notificationsAPI.getAll({ limit: 20 });

setNotifications(res.data.data);
setUnreadCount(res.data.unreadCount);

retryCount = 0; // reset retry
} catch (err) {
console.warn("⚠️ Notification fetch failed");

// 🔁 Retry automatique avec limite
if (retryCount < 5) {
retryCount++;
setTimeout(() => loadNotifications(true), retryCount * 2000);
}

if (!isRetry) {
console.error("❌ Notification error:", err);
}
}
};

// 🔄 Polling intelligent
useEffect(() => {
loadNotifications();

let interval = setInterval(() => {
if (!document.hidden) loadNotifications();
}, 12000); // 12s = meilleur équilibre

return () => clearInterval(interval);
}, []);

// 🔥 Recharge immédiate si l’utilisateur ouvre la cloche
useEffect(() => {
if (isOpen) loadNotifications();
}, [isOpen]);

// Fermer si clic extérieur
useEffect(() => {
const handleClickOutside = (e) => {
if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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
} catch {
toast.error("Erreur lors du marquage");
}
};

const markAllAsRead = async () => {
try {
await notificationsAPI.markAllAsRead();
loadNotifications();
} catch {
toast.error("Erreur lors du marquage");
}
};

const deleteNotification = async (id) => {
try {
await notificationsAPI.delete(id);
loadNotifications();
} catch {
toast.error("Erreur lors de la suppression");
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
return icons[type] || '🔔';
};

return (
<div className="relative" ref={dropdownRef}>
{/* ICON */}
<button
onClick={() => setIsOpen(!isOpen)}
className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100"
>
<Bell className="w-6 h-6" />
{unreadCount > 0 && (
<span className="absolute top-0 right-0 px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
{unreadCount}
</span>
)}
</button>

{/* DROPDOWN */}
{isOpen && (
<div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-[500px] flex flex-col">
<div className="flex items-center justify-between p-4 border-b">
<h3 className="text-lg font-bold text-gray-900">Notifications</h3>
{unreadCount > 0 && (
<button
onClick={markAllAsRead}
className="text-sm text-primary-600 flex items-center"
>
<CheckCheck className="w-4 h-4 mr-1" />
Tout marquer
</button>
)}
</div>

<div className="overflow-y-auto flex-1">
{notifications.length === 0 ? (
<div className="p-8 text-center text-gray-500">
<Bell className="w-12 h-12 mx-auto text-gray-300" />
<p>Aucune notification</p>
</div>
) : (
notifications.map((n) => (
<div
key={n._id}
className={`p-4 hover:bg-gray-50 ${
!n.isRead ? "bg-blue-50" : ""
}`}
>
<div className="flex justify-between">
<div className="flex-1">
<div className="flex items-center mb-1">
<span className="text-lg mr-2">
{getNotificationIcon(n.type)}
</span>
<p className="font-medium">{n.title}</p>
</div>
<p className="text-sm text-gray-600">{n.message}</p>
<p className="text-xs text-gray-400 mt-1">
{formatDistanceToNow(new Date(n.createdAt), {
addSuffix: true,
locale: fr,
})}
</p>
</div>

<div className="flex flex-col items-center ml-3">
{!n.isRead && (
<button
onClick={() => markAsRead(n._id)}
className="p-1 text-primary-600 hover:bg-primary-50 rounded"
>
<Check className="w-4 h-4" />
</button>
)}
<button
onClick={() => deleteNotification(n._id)}
className="p-1 text-red-600 hover:bg-red-50 rounded"
>
<Trash2 className="w-4 h-4" />
</button>
</div>
</div>
</div>
))
)}
</div>
</div>
)}
</div>
);
};

export default NotificationDropdown;
