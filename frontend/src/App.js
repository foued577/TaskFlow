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
// Components
import Layout from "./components/Layout";
import Loading from "./components/Loading";
// =======================================================
// 🛡 PROTECTED ROUTE
// =======================================================
const ProtectedRoute = ({ children }) => {
 const { user, loading } = useAuth();
 if (loading) return <Loading />;
 return user ? children : <Navigate to="/login" replace />;
};
// =======================================================
// 🚪 PUBLIC ROUTE (login/register)
// =======================================================
const PublicRoute = ({ children }) => {
 const { user, loading } = useAuth();
 if (loading) return <Loading />;
 return user ? <Navigate to="/" replace /> : children;
};
// =======================================================
// ROUTES
// =======================================================
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
       {/* Protected */}
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
</Route>
       {/* Redirect unknown */}
<Route path="*" element={<Navigate to="/" replace />} />
</Routes>
</Router>
 );
}
// =======================================================
// APP WRAPPER
// =======================================================
function App() {
 return (
<AuthProvider>
<AppRoutes />
<ToastContainer
       position="top-right"
       autoClose={3000}
       newestOnTop
       theme="light"
     />
</AuthProvider>
 );
}
export default App;
