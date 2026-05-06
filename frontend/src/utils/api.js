/**
 * API Client
 * Centralized API calls and request/response handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Helper function to add Authorization header
 */
const getHeaders = (headers = {}) => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...headers,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export const apiClient = {
  /**
   * Detect image - Upload file or URL
   */
  detectImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (!response.ok) {
      throw new Error(`Detection failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get detection history
   */
  getHistory: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/history?page=${page}&limit=${limit}`, {
      headers: getHeaders(),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  },

  /**
   * Submit feedback
   */
  submitFeedback: async (feedback) => {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(feedback),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (!response.ok) throw new Error('Failed to submit feedback');
    return response.json();
  },

  /**
   * Get user profile
   */
  getUserProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: getHeaders(),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  /**
   * Login
   */
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  /**
   * Logout
   */
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Logout failed');
    return response.json();
  },
};

/**
 * Handle API errors gracefully
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);
  return {
    success: false,
    message: error.message || 'An error occurred',
  };
};
