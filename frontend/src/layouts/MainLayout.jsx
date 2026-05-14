import React, { useState } from 'react';
import { LogOut, Menu, Search, ShieldCheck, X } from 'lucide-react';
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
    <div className="flex h-screen bg-slate-50 text-slate-950">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Open navigation"
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:flex">
                  <ShieldCheck size={20} />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-bold text-slate-950 sm:text-base">
                    HyperID AI Detector
                  </h1>
                  <p className="truncate text-xs text-slate-500">
                    {user?.displayName || user?.email || 'Security dashboard'}
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden flex-1 justify-center md:flex">
              <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                <Search size={16} />
                <span>Analyze images, videos, and detection evidence</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
