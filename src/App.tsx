import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import AppLayout from './components/AppLayout';
import Home from './components/Home';
import ReportForm from './components/ReportForm';
import FloodDashboard from './components/FloodDashboard';
import ResourceHub from './components/ResourceHub';
import SchoolDashboard from './components/SchoolDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProtectionDashboard from './components/ProtectionDashboard';
import DisasterDashboard from './components/DisasterDashboard';
import Profile from './components/Profile';
import AuthPage from './components/AuthPage';
import HistoryList from './components/HistoryList';
import Support from './components/Support';
import Donate from './components/Donate';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { profile } = useAuth();

  if (roles && profile && !roles.includes(profile.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<ReportForm />} />
        <Route path="/alerts" element={<FloodDashboard />} />
        <Route path="/resources" element={<ResourceHub />} />
        <Route path="/history" element={<HistoryList />} />
        <Route path="/support" element={<Support />} />
        <Route path="/donate" element={<Donate />} />
        
        <Route 
          path="/school-dashboard" 
          element={
            <ProtectedRoute roles={['Mentor/Teacher', 'Mentor', 'Teacher', 'Admin']}>
              <SchoolDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/protection-dashboard" 
          element={
            <ProtectedRoute roles={['Protection Officer', 'Admin']}>
              <ProtectionDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/disaster-dashboard" 
          element={
            <ProtectedRoute roles={['Disaster Management Officer', 'Admin']}>
              <DisasterDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute roles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={<Profile />} 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MainApp />
      </Router>
    </AuthProvider>
  );
}
