import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DetectPage } from './pages/DetectPage';
import { HistoryPage } from './pages/HistoryPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { AboutPage } from './pages/AboutPage';
import { ROUTES } from './constants/theme';

/**
 * Protected Route wrapper
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
}

/**
 * Main App Component with Routing
 */
function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated and not on login page
  if (!isAuthenticated && window.location.pathname !== ROUTES.LOGIN && window.location.pathname !== '/') {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Protected Routes */}
        <Route path={ROUTES.DETECT} element={<ProtectedRoute><DetectPage /></ProtectedRoute>} />
        <Route path={ROUTES.HISTORY} element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path={ROUTES.FEEDBACK} element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
        <Route path={ROUTES.PROFILE} element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* About - public info page */}
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />

        {/* Default redirect - check auth status */}
        <Route path={ROUTES.HOME} element={isAuthenticated ? <Navigate to={ROUTES.DETECT} replace /> : <Navigate to={ROUTES.LOGIN} replace />} />
        <Route path="*" element={isAuthenticated ? <Navigate to={ROUTES.DETECT} replace /> : <Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
