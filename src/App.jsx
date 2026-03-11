import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Cupboards from './pages/Cupboards';
import Inventory from './pages/Inventory';
import Borrowing from './pages/Borrowing';
import ActivityLog from './pages/ActivityLog';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-dark-950">
      <div className="w-8 h-8 border-2 border-accent rounded-full border-t-transparent animate-spin"/>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="inventory"   element={<Inventory />} />
        <Route path="borrowing"   element={<Borrowing />} />
        <Route path="logs"        element={<ActivityLog />} />
        <Route path="users"       element={<PrivateRoute adminOnly><Users /></PrivateRoute>} />
        <Route path="cupboards"   element={<PrivateRoute adminOnly><Cupboards /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}