import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../config/api';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const GOOGLE_WEB_CLIENT_ID = '174486315809-n8r88rj0o5b61ef2tjbgi8jdj4fvkicr.apps.googleusercontent.com';

const AuthContext = createContext();

const USER_KEY = 'vedicscan_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);

        // Check profile existence
        await refreshProfileStatus(storedToken);

        // Verify token validity
        try {
          const res = await api.get('/api/users/profile', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.data?.success) {
            const updatedUser = res.data.data;
            setUser(updatedUser);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
          }
        } catch (err) {
          console.error('Token invalid, clearing session');
          await clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      await clearSession();
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, 'vedicScanChatHistory', 'vedicScanConversationId']);
    } catch (e) {}
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setHasProfile(false);
  };

  const saveSession = async (newToken, userData) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      await refreshProfileStatus(newToken);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const googleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { accessToken } = await GoogleSignin.getTokens();

      if (!accessToken) {
        throw new Error('Google Sign-In failed: No access token');
      }

      const res = await api.post('/api/users/google-login', { token: accessToken });
      
      if (res.data?.success) {
        const { token: newToken, user: userData } = res.data.data;
        await saveSession(newToken, userData);
        return { success: true };
      } else {
        return { success: false, message: res.data?.message || 'Verification failed' };
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      return { success: false, error };
    }
  };

  const refreshProfileStatus = useCallback(async (authToken) => {
    const currentToken = authToken || token;
    if (!currentToken) {
      // Try from storage as fallback
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (!storedToken) return false;
    }
    const tkn = authToken || token || (await AsyncStorage.getItem(TOKEN_KEY));
    try {
      const res = await api.get('/api/profiles', {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      const exists = res.data && res.data.length > 0;
      setHasProfile(exists);
      return exists;
    } catch (err) {
      console.error('Failed to fetch profile status:', err?.message);
      return false;
    }
  }, [token]);

  const logout = async () => {
    await clearSession();
  };

  const getToken = async () => {
    return token || (await AsyncStorage.getItem(TOKEN_KEY));
  };

  const value = {
    user,
    setUser,
    token,
    loading,
    isAuthenticated,
    logout,
    saveSession,
    clearSession,
    getToken,
    hasProfile,
    refreshProfileStatus,
    googleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
