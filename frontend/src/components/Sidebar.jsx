import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, History, MessageSquare, User, LogOut, X, Info, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../constants/theme';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
/**
 * Sidebar Navigation Component
 */
export const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Detect', path: ROUTES.DETECT },
    { icon: History, label: 'History', path: ROUTES.HISTORY },
    { icon: MessageSquare, label: 'Feedback', path: ROUTES.FEEDBACK },
    { icon: Info, label: 'About', path: ROUTES.ABOUT },
    { icon: User, label: 'Profile', path: ROUTES.PROFILE },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200 bg-white
          transform transition-transform duration-300
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-950">HyperID</p>
              <p className="text-xs font-medium text-slate-500">AI Detector</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1.5 p-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ` +
                (isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950')
              }
            >
              <item.icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-100 p-4">
          <button
            onClick={async () => {
              await logout();
              navigate(ROUTES.LOGIN, { replace: true });
            }}
            className="
              flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left
              text-sm font-semibold text-rose-600 transition-all hover:bg-rose-50
            "
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
