import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../config/api';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { loginRevenueCat, logoutRevenueCat, syncToBackend } from '../config/revenuecat';

// IMPORTANT: Replace this with the "Web Client ID" from your new google-services.json (client_type: 3)
const GOOGLE_WEB_CLIENT_ID = '556295205143-hbht1irra1a2lb2vnp2i34ko6ki3c5dr.apps.googleusercontent.com';

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
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);

        // Re-identify user in RevenueCat after app restart
        if (parsedUser?._id) {
          loginRevenueCat(parsedUser._id);
        }

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
          console.log('Token invalid, clearing session');
          await clearSession();
        }

        // Sync RevenueCat → backend on every app start to catch any missed webhooks
        syncToBackend().catch(() => {});

      }
    } catch (error) {
      console.log('Error loading session:', error);
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
    setLoading(true);
    try {
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      // Identify this user in RevenueCat so purchases are linked to their account
      if (userData?._id) {
        loginRevenueCat(userData._id);
      }
      await refreshProfileStatus(newToken);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('Error saving session:', error);
    } finally {
      setLoading(false);
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
      console.log('Google Sign-In Error:', error);
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
      console.log('Failed to fetch profile status:', err?.message);
      return false;
    }
  }, [token]);

  const logout = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // May fail if user didn't sign in with Google
    }
    await logoutRevenueCat();
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
