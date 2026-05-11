import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../utils/api';

/**
 * AuthContext - Manages user authentication state
 * Stores user info and JWT token in localStorage
 */
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize auth state from localStorage on mount
   */
  useEffect(() => {
    const restoreAuthState = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken) {
        setToken(storedToken);
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          apiClient.clearAuthState();
        }
      }

      if (storedToken) {
        try {
          const profile = await apiClient.getUserProfile();
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        } catch (error) {
          console.error('Failed to refresh profile during init:', error);
          setToken(null);
          setUser(null);
          apiClient.clearAuthState();
        }
      }

      setIsLoading(false);
    };

    restoreAuthState();
  }, []);

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<boolean>} - True if login successful
   */
  const login = async (email, password) => {
    const response = await apiClient.login(email, password);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
    return response;
  };

  const register = async ({ email, password, confirmPassword, displayName }) => {
    const response = await apiClient.register({
      email,
      password,
      confirmPassword,
      displayName,
    });

    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
    return response;
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      if (token) {
        await apiClient.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearAuthState();
      setToken(null);
      setUser(null);
    }
  };

  /**
   * Refresh user profile from server
   */
  const refreshProfile = async () => {
    if (!token) return;

    try {
      const profile = await apiClient.getUserProfile();
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
      return profile;
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth - Hook to access auth context
 * @returns {object} - Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
