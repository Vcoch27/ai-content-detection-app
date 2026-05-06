/**
 * Design System & Theme Constants
 * Centralized styling for consistency across the app
 */

export const THEME = {
  colors: {
    primary: '#3B82F6',
    primaryDark: '#1E40AF',
    primaryLight: '#DBEAFE',
    secondary: '#8B5CF6',
    secondaryDark: '#6D28D9',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#06B6D4',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    divider: '#F3F4F6',
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
};

export const TRANSITIONS = {
  fast: '150ms ease-in-out',
  base: '300ms ease-in-out',
  slow: '500ms ease-in-out',
};

export const ROUTES = {
  HOME: '/',
  DETECT: '/detect',
  HISTORY: '/history',
  FEEDBACK: '/feedback',
  PROFILE: '/profile',
  ABOUT: '/about',
  LOGIN: '/login',
  LOGOUT: '/logout',
};
