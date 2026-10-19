/**
 * Centralized Axios API Client (CLAUDE.md §9, SAD §4.5)
 *
 * - baseURL: '/api'
 * - Request interceptor: attaches 'Authorization: Bearer <token>' from sessionStorage ('oipp_auth')
 * - Response interceptor:
 *     - If 401 UNAUTHORIZED: clears auth and redirects to '/login'
 *     - Normalizes error rejections to `{ code, message, details }` from the backend envelope
 */

import axios from 'axios';

const AUTH_STORAGE_KEY = 'oipp_auth';

export const getStoredAuth = () => {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredAuth = (data) => {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage quota or security restriction fallback
  }
};

export const clearStoredAuth = () => {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
};

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: injects Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const auth = getStoredAuth();
    if (auth && auth.token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 UNAUTHORIZED and normalize error envelope
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorResponse = error.response?.data?.error;
    const status = error.response?.status;

    const normalizedError = {
      code: errorResponse?.code || (status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR'),
      message: errorResponse?.message || 'Something went wrong. Please try again later.',
      details: errorResponse?.details || null,
      status: status || 500,
    };

    if (status === 401 && normalizedError.code === 'UNAUTHORIZED') {
      clearStoredAuth();
      if (typeof window !== 'undefined' && window.location && window.location.pathname !== '/login') {
        try {
          if (typeof window.location.assign === 'function') {
            window.location.assign('/login');
          } else {
            window.location.href = '/login';
          }
        } catch {
          // Guard for test environments (jsdom navigation limitation)
        }
      }
    }

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
