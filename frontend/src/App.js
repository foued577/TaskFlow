import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Kanban from './pages/Kanban';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import Export from './pages/Export';
// 🔥 NEW PAGE
import UserManagement from './pages/UserManagement';
// Components
import Layout from './components/Layout';
import Loading from './components/Loading';

// ============================
// 🔐 Protected Route (User logged in)
// ============================
const ProtectedRoute = ({ children }) => {
 const { isAuthenticated, loading } = useAuth();
 if (loading) return <Loading />;
 return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ============================
// 🔐 Admin-only Route
// ============================
const AdminRoute = ({ children }) => {
 const { user, loading } = useAuth();
 if (loading) return <Loading />;
 return user?.role === "admin"
   ? children
   : <Navigate to="/" replace />;
};

// ============================
// ⛔ Public Route (redirect if logged in)
// ============================
const PublicRoute = ({ children }) => {
 const { isAuthenticated, loading } = useAuth();
 if (loading) return <Loading />;
 return !isAuthenticated ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
 return (
<Router>
<Routes>
       {/* Public routes */}
<Route
         path="/login"
         element={
<PublicRoute>
<Login />
</PublicRoute>
         }
       />
<Route
         path="/register"
         element={
<PublicRoute>
<Register />
</PublicRoute>
         }
       />
       {/* Protected routes */}
<Route
         path="/"
         element={
<ProtectedRoute>
<Layout />
</ProtectedRoute>
         }
>
<Route index element={<Dashboard />} />
<Route path="teams" element={<Teams />} />
<Route path="projects" element={<Projects />} />
<Route path="tasks" element={<Tasks />} />
<Route path="kanban" element={<Kanban />} />
<Route path="calendar" element={<Calendar />} />
<Route path="export" element={<Export />} />
<Route path="profile" element={<Profile />} />
         {/* 🔥 NEW: Admin-only route */}
<Route
           path="admin/users"
           element={
<AdminRoute>
<UserManagement />
</AdminRoute>
           }
         />
</Route>
       {/* Fallback */}
<Route path="*" element={<Navigate to="/" replace />} />
</Routes>
</Router>
 );
}

function App() {
 return (
<AuthProvider>
<AppRoutes />
<ToastContainer
       position="top-right"
       autoClose={3000}
       hideProgressBar={false}
       newestOnTop
       closeOnClick
       pauseOnFocusLoss
       draggable
       pauseOnHover
       theme="light"
     />
</AuthProvider>
 );
}
export default App;
