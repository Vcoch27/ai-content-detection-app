/**
 * API Client
 * Centralized API calls and request/response handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = {
  /**
   * Detect image - Upload file or URL
   */
  detectImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Detection failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get detection history
   */
  getHistory: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/history?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  },

  /**
   * Submit feedback
   */
  submitFeedback: async (imageId, isCorrect, message) => {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, isCorrect, message }),
    });

    if (!response.ok) throw new Error('Failed to submit feedback');
    return response.json();
  },

  /**
   * Get user profile
   */
  getUserProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/profile`);
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

    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  /**
   * Logout
   */
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
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
