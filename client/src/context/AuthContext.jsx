import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and attempt to restore user session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Single call to /auth/refresh — the backend now returns both accessToken and user
        const response = await api.post('/auth/refresh');
        const { accessToken, user: refreshedUser } = response.data;

        setAccessToken(accessToken);

        if (refreshedUser) {
          // User data is included in the refresh response — no extra /auth/me call needed
          setUser(refreshedUser);
          setIsAuthenticated(true);
        } else {
          // Fallback: fetch user profile separately if backend doesn't return user
          const userResponse = await api.get('/auth/me');
          setUser(userResponse.data.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen to session expiry event broadcast by Axios interceptor
    const handleSessionExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      setAccessToken(null);
    };

    window.addEventListener('auth-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: loggedUser, accessToken } = response.data;
      
      setAccessToken(accessToken);
      setUser(loggedUser);
      setIsAuthenticated(true);
      return loggedUser;
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      throw err.response?.data?.message || 'Login failed. Please check your credentials.';
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to process request.';
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to reset password.';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
