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
        // Attempt to request a new access token via httpOnly refresh token
        const response = await api.post('/auth/refresh');
        const { accessToken } = response.data;
        setAccessToken(accessToken);

        // Fetch user context if token was successfully refreshed.
        // Wait, do we have a route to get the logged-in user's profile?
        // Let's check, we haven't implemented getProfile route yet, but we will return the user info directly
        // in login/refresh or we can implement a `/auth/me` endpoint.
        // Wait! In the AuthService login, we returned: user, accessToken, refreshToken.
        // Let's see: during a refresh request `/auth/refresh`, we can return the accessToken.
        // Wait, to populate user state on initial app load, it would be extremely elegant if `/auth/refresh` or a `/auth/me` endpoint returned user details!
        // Oh! Let's check our backend AuthService:
        // `refreshUserToken` in AuthService:
        // ```javascript
        // const user = await UserRepository.findById(decoded.id);
        // ...
        // const accessToken = generateAccessToken(user);
        // return { accessToken };
        // ```
        // Yes, the backend `/auth/refresh` currently returns `accessToken` only.
        // We can create a lightweight `/auth/me` endpoint (e.g. GET `/auth/me`) which returns user info,
        // or we can decode the user details directly from the JWT access token itself!
        // That is an incredibly elegant and performant SPA design! Since the JWT contains the `id`, `role`, and `status`,
        // and we also want the user `name` and `email`, let's see. Decoding the access token is good, but calling a `/auth/me` endpoint is standard
        // and guarantees we have fresh database status.
        // Wait, let's see if we can decode the JWT access token, or simply add `user` to `/auth/refresh` response, or implement `me` controller.
        // Actually, let's implement a `/auth/me` route in the backend! That is extremely clean and reliable.
        // Let's write `AuthContext` to use a `/auth/me` endpoint, and we'll implement `/auth/me` in the backend routes immediately!
        
        // Let's first try to hit `/auth/me` or fetch user details.
        // If we hit `/auth/me`, we can populate setUser.
        const profileRes = await api.post('/auth/refresh'); // First refresh
        const freshToken = profileRes.data.accessToken;
        setAccessToken(freshToken);

        // Standard token decode for name/email/role or fetching `/auth/me`
        // Let's decode the JWT locally to get basic claims or call an endpoint.
        // Let's build a standard `/auth/me` endpoint. We can implement it right away.
        // For now, in AuthContext, let's fetch user profile:
        const userResponse = await api.get('/auth/me');
        setUser(userResponse.data.user);
        setIsAuthenticated(true);
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
