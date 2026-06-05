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

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (roles && profile && !roles.includes(profile.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<ReportForm />} />
            <Route path="/alerts" element={<FloodDashboard />} />
            <Route path="/resources" element={<ResourceHub />} />
            <Route path="/history" element={<HistoryList />} />
            <Route path="/auth" element={<AuthPage />} />
            
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
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
}
