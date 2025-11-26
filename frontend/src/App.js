import React from "react";
import {
 BrowserRouter as Router,
 Routes,
 Route,
 Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Kanban from "./pages/Kanban";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import Export from "./pages/Export";
import UserManagement from "./pages/UserManagement"; // ✅ NEW PAGE
// Components
import Layout from "./components/Layout";
import Loading from "./components/Loading";
// Component: Protected route
const ProtectedRoute = ({ children }) => {
 const { user, loading } = useAuth();
 if (loading) return <Loading />;
 return user ? children : <Navigate to="/login" replace />;
};
// Component: Admin only route
const AdminRoute = ({ children }) => {
 const { user, loading } = useAuth();
 if (loading) return <Loading />;
 return user?.role === "admin" ? children : <Navigate to="/" replace />;
};
// Component: Public route
const PublicRoute = ({ children }) => {
 const { user, loading } = useAuth();
 if (loading) return <Loading />;
 return !user ? children : <Navigate to="/" replace />;
};
function AppRoutes() {
 return (
<Router>
<Routes>
       {/* Public */}
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
       {/* Protected layout */}
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
         {/* ADMIN ONLY */}
<Route
           path="users"
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
<ToastContainer position="top-right" autoClose={3000} theme="light" />
</AuthProvider>
 );
}
export default App;
