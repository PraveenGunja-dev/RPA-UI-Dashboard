import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DepartmentDashboard from './pages/DepartmentDashboard';
import BotDetails from './pages/BotDetails';
import OrgTreeView from './pages/OrgTreeView';
import AdminPage from './pages/AdminPage';
import SSOLoginPage from './pages/SSOLoginPage';

import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/home" replace /> : <SSOLoginPage />} />
      <Route path="/home" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
      <Route path="/department/:id" element={<ProtectedRoute><DepartmentDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/:name" element={<ProtectedRoute><DepartmentDashboard /></ProtectedRoute>} />
      <Route path="/bot/:id" element={<ProtectedRoute><BotDetails /></ProtectedRoute>} />
      <Route path="/tree" element={<ProtectedRoute><OrgTreeView /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
