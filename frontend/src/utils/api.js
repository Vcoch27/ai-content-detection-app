/**
 * API client aligned to the backend contract.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';

const STORAGE_KEYS = {
  token: 'token',
  user: 'user',
};

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const clearAuthState = () => {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
};

const redirectToLogin = () => {
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
};

const handleUnauthorized = () => {
  clearAuthState();
  redirectToLogin();
};

const getToken = () => localStorage.getItem(STORAGE_KEYS.token);

const buildRequestHeaders = ({ json = true, auth = true, headers = {} } = {}) => {
  const finalHeaders = { ...headers };

  if (json) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  return finalHeaders;
};

const buildUrl = (path) => {
  const normalizedPath = path.startsWith('/api') ? path : `/api${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  let payload = null;
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === 'object' &&
        (payload.message || payload.error || payload.reason)) ||
      (typeof payload === 'string' && payload) ||
      response.statusText ||
      'Request failed';

    if (response.status === 401) {
      handleUnauthorized();
    }

    throw new ApiError(message, response.status, payload);
  }

  return payload;
};

const request = async (path, options = {}) => {
  const { json = true, auth = true, headers = {}, body, ...rest } = options;
  const finalHeaders = buildRequestHeaders({ json, auth, headers });
  const init = {
    ...rest,
    headers: finalHeaders,
  };

  if (body !== undefined) {
    init.body = body;
  }

  const response = await fetch(buildUrl(path), init);
  return parseResponse(response);
};

const getPublicDetectionImageUrl = (storageBucket, storageKey) => {
  if (!storageKey) {
    return '';
  }

  if (/^https?:\/\//i.test(storageKey)) {
    return storageKey;
  }

  const bucket = storageBucket || import.meta.env.VITE_AWS_BUCKET_NAME;
  if (!bucket) {
    return storageKey;
  }

  return `https://${bucket}.s3.${AWS_REGION}.amazonaws.com/${encodeURI(storageKey)}`;
};

export const getPublicDetectionVideoUrl = (storageBucket, storageKey) => {
  // Same logic as image URL since both are stored in S3
  return getPublicDetectionImageUrl(storageBucket, storageKey);
};

export const apiClient = {
  detectImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/predict', {
      method: 'POST',
      auth: true,
      json: false,
      body: formData,
    });
  },

  detectVideo: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/predict-video', {
      method: 'POST',
      auth: true,
      json: false,
      body: formData,
    });
  },

  getHistory: async (page = 1, limit = 10) => {
    return request(`/history?page=${page}&limit=${limit}`, {
      method: 'GET',
      auth: true,
    });
  },

  deleteHistoryItem: async (id) => {
    return request(`/history/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  submitFeedback: async (feedback) => {
    const payload = {
      imageId: Number(feedback.imageId),
      isCorrect: Boolean(feedback.isCorrect),
      ...(feedback.message?.trim() ? { message: feedback.message.trim() } : {}),
    };

    return request('/feedback', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  getUserProfile: async () => {
    return request('/auth/profile', {
      method: 'GET',
      auth: true,
    });
  },

  register: async ({ email, password, confirmPassword, displayName }) => {
    return request('/auth/register', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({
        email,
        password,
        confirmPassword,
        displayName,
      }),
    });
  },

  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async () => {
    try {
      return await request('/auth/logout', {
        method: 'POST',
        auth: true,
      });
    } finally {
      clearAuthState();
    }
  },

  clearAuthState,
  getPublicDetectionImageUrl,
};

export const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error instanceof ApiError) {
    return {
      success: false,
      status: error.status,
      message: error.message,
      payload: error.payload,
    };
  }

  return {
    success: false,
    message: error?.message || 'An error occurred',
  };
};
