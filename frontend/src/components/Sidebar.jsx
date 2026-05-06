import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, History, MessageSquare, User, LogOut, Menu, X, Info } from 'lucide-react';
import { ROUTES } from '../constants/theme';
import { Link } from 'react-router-dom';
/**
 * Sidebar Navigation Component
 */
export const Sidebar = ({ isOpen, onClose }) => {
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
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 bg-gray-950 text-white
          transform transition-transform duration-300 z-40
          lg:relative lg:translate-x-0 lg:bg-white lg:text-gray-900
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Close button mobile */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <h1 className="text-xl font-bold">Menu</h1>
          <button onClick={onClose} className="p-1">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 p-6">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ` +
                (isActive
                  ? 'bg-blue-50 text-blue-600 lg:bg-blue-50 lg:text-blue-600'
                  : 'text-white lg:text-gray-900 hover:bg-gray-800 lg:hover:bg-gray-50')
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-6 left-6 right-6">
          <Link
            to={ROUTES.LOGIN}
            className="
              flex items-center gap-3 px-4 py-3 rounded-lg
              text-red-500 hover:bg-red-50 lg:hover:bg-red-50
              transition-colors font-medium
            "
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
