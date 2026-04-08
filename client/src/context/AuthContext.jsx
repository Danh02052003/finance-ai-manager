import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getCurrentUser, loginUser, logoutUser, registerUser } from '../api/authApi.js';
import { AUTH_UNAUTHORIZED_EVENT } from '../api/http.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      setUser(response?.data?.user || null);
      return response?.data?.user || null;
    } catch (error) {
      if (error.statusCode === 401) {
        setUser(null);
        return null;
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser().catch(() => {
      setUser(null);
      setIsLoading(false);
    });
  }, [refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (payload) => {
    const response = await loginUser(payload);
    setUser(response?.data?.user || null);
    return response;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await registerUser(payload);
    setUser(response?.data?.user || null);
    return response;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user?._id),
      login,
      logout,
      refreshUser,
      register
    }),
    [isLoading, login, logout, refreshUser, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
};
