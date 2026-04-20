import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your machine's LAN IP for physical device testing
// For Android emulator: 10.0.2.2
// For iOS simulator: localhost works
const BACKEND_URL = 'http://172.16.196.84:8001';

const TOKEN_KEY = 'vedicscan_token';

// Create axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear session
      await AsyncStorage.multiRemove([TOKEN_KEY, 'vedicscan_user']);
      // Navigation to login is handled by AuthContext listener
    }
    return Promise.reject(error);
  }
);

export { BACKEND_URL, TOKEN_KEY };
export default api;
