import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getCurrentUser, loginUser, logoutUser, registerUser } from '../api/authApi.js';
import { AUTH_UNAUTHORIZED_EVENT } from '../api/http.js';

const AuthContext = createContext(null);
const AUTH_USER_CACHE_KEY = 'finance-auth-user-cache';
const AUTH_USER_CACHE_TTL_MS = 1000 * 60 * 10;

const readCachedAuthUser = () => {
  try {
    const rawValue = window.sessionStorage.getItem(AUTH_USER_CACHE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== 'object') {
      return null;
    }

    if (!parsedValue.timestamp || Date.now() - parsedValue.timestamp > AUTH_USER_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(AUTH_USER_CACHE_KEY);
      return null;
    }

    return parsedValue.user || null;
  } catch {
    return null;
  }
};

const writeCachedAuthUser = (user) => {
  try {
    if (!user?._id) {
      window.sessionStorage.removeItem(AUTH_USER_CACHE_KEY);
      return;
    }

    window.sessionStorage.setItem(
      AUTH_USER_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        user
      })
    );
  } catch {
    // Ignore storage failures.
  }
};

const clearCachedAuthUser = () => {
  try {
    window.sessionStorage.removeItem(AUTH_USER_CACHE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readCachedAuthUser());
  const [isLoading, setIsLoading] = useState(() => !readCachedAuthUser());

  const refreshUser = useCallback(async ({ background = false } = {}) => {
    if (!background) {
      setIsLoading(true);
    }

    try {
      const response = await getCurrentUser();
      const nextUser = response?.data?.user || null;
      setUser(nextUser);
      writeCachedAuthUser(nextUser);
      return nextUser;
    } catch (error) {
      if (error.statusCode === 401) {
        setUser(null);
        clearCachedAuthUser();
        return null;
      }

      throw error;
    } finally {
      if (!background) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshUser({ background: Boolean(readCachedAuthUser()) }).catch(() => {
      setUser(null);
      clearCachedAuthUser();
      setIsLoading(false);
    });
  }, [refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      clearCachedAuthUser();
      setIsLoading(false);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (payload) => {
    const response = await loginUser(payload);
    const nextUser = response?.data?.user || null;
    setUser(nextUser);
    writeCachedAuthUser(nextUser);
    return response;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await registerUser(payload);
    const nextUser = response?.data?.user || null;
    setUser(nextUser);
    writeCachedAuthUser(nextUser);
    return response;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    clearCachedAuthUser();
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
