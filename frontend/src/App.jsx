import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DetectPage } from './pages/DetectPage';
import { HistoryPage } from './pages/HistoryPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AboutPage } from './pages/AboutPage';
import { ROUTES } from './constants/theme';

const AppLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      <p className="text-sm font-medium text-slate-600">Loading HyperID dashboard...</p>
    </div>
  </div>
);

/**
 * Protected Route wrapper
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoading />;
  }

  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
}

/**
 * Main App Component with Routing
 */
function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoading />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path={ROUTES.DETECT}
          element={
            <ProtectedRoute>
              <DetectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.HISTORY}
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.FEEDBACK}
          element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* About - public info page */}
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />

        {/* Default redirect - check auth status */}
        <Route
          path={ROUTES.HOME}
          element={
            isAuthenticated ? (
              <Navigate to={ROUTES.DETECT} replace />
            ) : (
              <Navigate to={ROUTES.LOGIN} replace />
            )
          }
        />
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to={ROUTES.DETECT} replace />
            ) : (
              <Navigate to={ROUTES.LOGIN} replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
