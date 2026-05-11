import React, { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ROUTES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

/**
 * Main Layout wrapper for authenticated pages
 */
export const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">HyperID AI Detector</h1>
              <p className="text-sm text-gray-500">
                {user?.displayName || user?.email || 'Signed in user'}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut size={24} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};
