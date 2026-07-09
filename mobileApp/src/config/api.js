import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

// Use your machine's LAN IP for physical device testing
// For Android emulator: 10.0.2.2
// For iOS simulator: localhost works
// We use localhost by default and recommend 'adb reverse tcp:8001 tcp:8001' for Android
const BACKEND_URL = Platform.select({
  android: 'https://vedicscan.com/', // Use localhost + adb reverse for reliable USB debugging
  ios: 'https://vedicscan.com/',
  default: 'https://vedicscan.com/',
});

// If you are using a physical device, you might need to change this to your LAN IP:
// const BACKEND_URL = 'http://192.168.0.111:8001';

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
      if (__DEV__) console.log('Error reading token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (__DEV__) {
      console.log('API Error:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

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
