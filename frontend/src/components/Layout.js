// frontend/src/components/Layout.js :
import React, { useState, useEffect } from "react";
import { Outlet, Link as RouterLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
LayoutDashboard,
Users,
FolderKanban,
CheckSquare,
Calendar as CalendarIcon,
FileDown,
Bell,
User,
LogOut,
Menu,
X,
Sun,
Moon,
Shield,
Link as LinkIcon // ✅ AJOUT IMPORT ICÔNE
} from "lucide-react";

import NotificationDropdown from "./NotificationDropdown";

// ✅ ✅ ✅ AJOUT LOGO (chemin relatif au projet)
import taskflowLogo from "../assets/logotaskflow.png";

const Layout = () => {
const { user, logout } = useAuth();
const location = useLocation();
const [sidebarOpen, setSidebarOpen] = useState(false);
const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

const navigation = [
{ name: "Tableau de bord", path: "/", icon: LayoutDashboard },
{ name: "Équipes", path: "/teams", icon: Users },
{ name: "Projets", path: "/projects", icon: FolderKanban },
{ name: "Tâches", path: "/tasks", icon: CheckSquare },
{ name: "Kanban", path: "/kanban", icon: FolderKanban },
{ name: "Planning", path: "/calendar", icon: CalendarIcon },
{ name: "Exports Excel", path: "/export", icon: FileDown },

// ✅ LIGNE AJOUTÉE — LIENS UTILES
{ name: "Liens utiles", path: "/useful-links", icon: LinkIcon },
];

if (user?.role === "admin") {
navigation.push({
name: "Gestion utilisateurs",
path: "/users",
icon: Shield,
});
}

const isActive = (path) => location.pathname === path;

useEffect(() => {
document.documentElement.classList.toggle("dark", theme === "dark");
localStorage.setItem("theme", theme);
}, [theme]);

return (
<div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">

{/* SIDEBAR */}
<aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
<div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r">

{/* LOGO */}
<div className="flex items-center justify-between h-16 px-6 border-b">
{/* ✅ ✅ ✅ LOGO IMAGE AU LIEU DU TEXTE */}
<RouterLink to="/" className="flex items-center">
<img
src={taskflowLogo}
alt="TaskFlow"
className="h-8 w-auto"
draggable={false}
/>
</RouterLink>

<button
onClick={() => setTheme(theme === "light" ? "dark" : "light")}
className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
>
{theme === "light" ? (
<Moon className="w-5 h-5 text-gray-600" />
) : (
<Sun className="w-5 h-5 text-yellow-400" />
)}
</button>
</div>

{/* NAVIGATION */}
<nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
{navigation.map((item) => {
const Icon = item.icon;
return (
<RouterLink
key={item.path}
to={item.path}
className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
isActive(item.path)
? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
}`}
>
<Icon className="w-5 h-5 mr-3" />
{item.name}
</RouterLink>
);
})}
</nav>

{/* USER SECTION */}
<div className="p-4 border-t">
<div className="flex items-center mb-3">
<div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
{user?.firstName?.charAt(0)}
{user?.lastName?.charAt(0)}
</div>
<div className="ml-3">
<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
{user?.firstName} {user?.lastName}
</p>
<p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
</div>
</div>

<div className="flex space-x-2">
<RouterLink
to="/profile"
className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 flex items-center justify-center"
>
<User className="w-4 h-4 mr-2" />
Profil
</RouterLink>

<button
onClick={logout}
className="flex-1 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/30 rounded-lg text-red-700 flex items-center justify-center"
>
<LogOut className="w-4 h-4 mr-2" />
Sortir
</button>
</div>
</div>
</div>
</aside>

{/* TOP HEADER */}
<div className="md:pl-64">
<header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b">
<div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

{/* MOBILE MENU BUTTON */}
<button
className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
onClick={() => setSidebarOpen(true)}
>
<Menu className="w-6 h-6" />
</button>

{/* NOTIFICATIONS RIGHT SIDE */}
<div className="flex items-center space-x-4 ml-auto">
<NotificationDropdown />
</div>
</div>
</header>

{/* PAGE CONTENT */}
<main className="p-4 sm:p-6 lg:p-8">
<AnimatePresence mode="wait">
<motion.div
key={location.pathname}
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -10 }}
transition={{ duration: 0.3 }}
>
<Outlet />
</motion.div>
</AnimatePresence>
</main>
</div>
</div>
);
};

export default Layout;
