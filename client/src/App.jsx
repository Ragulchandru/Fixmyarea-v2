import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportIssue from './pages/ReportIssue';
import CommunityFeed from './pages/CommunityFeed';
import IssueDetails from './pages/IssueDetails';
import MapView from './pages/MapView';
import MyReports from './pages/MyReports';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Maintenance from './pages/Maintenance';

function AppContent() {
  const { user, loading, isMaintenance, t } = useAuth();
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-500 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-sm font-semibold tracking-wide uppercase">{t('loading')}</p>
      </div>
    );
  }

  // Maintenance Guard: If active, force non-admins to the Maintenance page.
  // We keep the /login route open so admins can log in to disable it.
  const isAdmin = user && user.role === 'admin';
  if (isMaintenance && !isAdmin) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Maintenance />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation structures */}
      <Navbar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[240px] md:pt-4 pb-[72px] md:pb-6 p-4 md:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/feed" element={<CommunityFeed />} />
          <Route path="/issue-detail/:id" element={<IssueDetails />} />
          <Route path="/map-view" element={<MapView />} />

          {/* Citizen Protected Routes */}
          <Route 
            path="/report" 
            element={
              <ProtectedRoute allowedRoles={['citizen', 'employee', 'admin']}>
                <ReportIssue />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-reports" 
            element={
              <ProtectedRoute allowedRoles={['citizen', 'employee', 'admin']}>
                <MyReports />
              </ProtectedRoute>
            } 
          />

          {/* General Auth Protected Routes */}
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute allowedRoles={['citizen', 'employee', 'admin']}>
                <Notifications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={['citizen', 'employee', 'admin']}>
                <Profile />
              </ProtectedRoute>
            } 
          />

          {/* Admin Protected Routes */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Employee Protected Routes */}
          <Route 
            path="/employee-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
