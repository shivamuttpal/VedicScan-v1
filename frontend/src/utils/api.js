import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const TOKEN_KEY = 'vedicscan_token';

// Create axios instance with default config
const api = axios.create({
  baseURL: BACKEND_URL,
  // Don't use withCredentials when using Bearer token auth
  withCredentials: false,
});

// Add request interceptor to include auth token from localStorage
api.interceptors.request.use(async (config) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting session for request:', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear session and redirect to login
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('vedicscan_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
