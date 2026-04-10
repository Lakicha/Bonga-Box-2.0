import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { LoadingFallback } from './components/LoadingFallback';
import Navbar from './components/Navbar';
import Home from './components/Home';
import AuthPage from './components/AuthPage';

// Lazy load heavy components
const ReportForm = React.lazy(() => import('./components/ReportForm'));
const FloodDashboard = React.lazy(() => import('./components/FloodDashboard'));
const ResourceHub = React.lazy(() => import('./components/ResourceHub'));
const SchoolDashboard = React.lazy(() => import('./components/SchoolDashboard'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const Profile = React.lazy(() => import('./components/Profile'));

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (roles && profile && !roles.includes(profile.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow" id="main-content">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/report" element={<ReportForm />} />
                    <Route path="/alerts" element={<FloodDashboard />} />
                    <Route path="/resources" element={<ResourceHub />} />
                    <Route path="/auth" element={<AuthPage />} />
                    
                    <Route 
                      path="/school-dashboard" 
                      element={
                        <ProtectedRoute roles={['Mentor', 'Teacher', 'Admin']}>
                          <SchoolDashboard />
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
                </Suspense>
              </main>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
