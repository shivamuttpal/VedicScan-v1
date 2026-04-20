import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Local storage keys
const TOKEN_KEY = 'vedicscan_token';
const USER_KEY = 'vedicscan_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    // Load session from localStorage on mount
    const loadSession = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          
          // Initial check for profile existence
          refreshProfileStatus(storedToken);
          
          // Verify token and fetch latest profile
          try {
            const res = await axios.get(`${BACKEND_URL}/api/users/profile`, {
              headers: { Authorization: `Bearer ${storedToken}` }
            });
            if (res.data?.success) {
              const updatedUser = res.data.data;
              setUser(updatedUser);
              localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            }
          } catch (err) {
            console.error('Failed to verify session', err);
            clearSession();
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
        clearSession();
      } finally {
        setLoading(false);
      }
    };
    
    loadSession();
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('vedicScanChatHistory');
    localStorage.removeItem('vedicScanConversationId');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setHasProfile(false);
  }, []);

  const refreshProfileStatus = useCallback(async (authToken) => {
    const currentToken = authToken || token || localStorage.getItem(TOKEN_KEY);
    if (!currentToken) return false;
    
    try {
      const res = await axios.get(`${BACKEND_URL}/api/profiles`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const exists = res.data && res.data.length > 0;
      setHasProfile(exists);
      return exists;
    } catch (err) {
      console.error('Failed to fetch profile status', err);
      return false;
    }
  }, [token]);

  const saveSession = useCallback((newToken, userData) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    refreshProfileStatus(newToken);
  }, [refreshProfileStatus]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const getToken = useCallback(() => {
    return token || localStorage.getItem(TOKEN_KEY);
  }, [token]);

  const checkAuth = useCallback(async () => {
    try {
      const currentToken = token || localStorage.getItem(TOKEN_KEY);
      if (!currentToken) return false;
      const res = await axios.get(`${BACKEND_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.data?.success) {
        setUser(res.data.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.data));
        return true;
      }
    } catch (err) {
      console.error('Failed checkAuth', err);
    }
    return false;
  }, [token]);

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
    checkAuth,
    hasProfile,
    refreshProfileStatus
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
