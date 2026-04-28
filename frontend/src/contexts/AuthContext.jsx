/*
  AuthContext — Centralised authentication state for the entire app.
  Wraps the React tree so every component can `useAuth()`.
  On mount it tries to restore the session from the httpOnly cookie (GET /auth/me).
*/

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authAPI,
  clearAccessToken,
  clearRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../services/api';
import {
  getExtensionRoles,
  hasAllPermissions,
  hasAnyPermission,
  hasAnyRole,
  hasPermission,
  resolveCoreRole,
} from '../utils/rbac';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check cookies
  const [error, setError] = useState(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  const isAuthenticated = !!user;

  /* ── Restore session on mount ─────────────────────────────── */
  const fetchUser = useCallback(async () => {
    try {
      const data = await authAPI.getMe();
      const fetchedUser = data.data?.user ?? data.user ?? data;
      setUser(fetchedUser);
      setRequiresPasswordChange(Boolean(fetchedUser?.firstUse));
      setError(null);
    } catch (fetchError) {
      if (fetchError?.status === 401) {
        clearAccessToken();
        clearRefreshToken();
      }
      setUser(null);
      setRequiresPasswordChange(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const handleWindowFocus = () => {
      if (user) {
        fetchUser();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchUser, user]);

  /* ── Login ────────────────────────────────────────────────── */
  const login = async (email, password) => {
    setError(null);
    const data = await authAPI.login(email, password);
    const accessToken = data?.data?.accessToken || data?.accessToken;
    const refreshToken = data?.data?.refreshToken || data?.refreshToken;
    if (accessToken) {
      setAccessToken(accessToken);
    }
    if (refreshToken) {
      setRefreshToken(refreshToken);
    }

    const loggedUser = data.data?.user ?? data.user;
    const shouldChangePassword = Boolean(data.data?.requiresPasswordChange || loggedUser?.firstUse);

    setUser(loggedUser);
    setRequiresPasswordChange(shouldChangePassword);

    return {
      user: loggedUser,
      requiresPasswordChange: shouldChangePassword,
    };
  };

  /* ── Register ─────────────────────────────────────────────── */
  const register = async (userData) => {
    setError(null);
    const data = await authAPI.register(userData);
    const newUser = data.data?.user ?? data.user;
    setUser(newUser);
    setRequiresPasswordChange(Boolean(newUser?.firstUse));
    return newUser;
  };

  /* ── Logout ───────────────────────────────────────────────── */
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      /* best-effort */
    }
    clearAccessToken();
    clearRefreshToken();
    setUser(null);
    setRequiresPasswordChange(false);
  };

  const clearError = () => setError(null);

  const hasRole = useCallback((roles = []) => hasAnyRole(user, roles), [user]);
  const can = useCallback((permissionCode) => hasPermission(user, permissionCode), [user]);
  const canAny = useCallback((permissionCodes = []) => hasAnyPermission(user, permissionCodes), [user]);
  const canAll = useCallback((permissionCodes = []) => hasAllPermissions(user, permissionCodes), [user]);
  const coreRole = resolveCoreRole(user);
  const extensions = getExtensionRoles(user);

  const value = {
    user,
    coreRole,
    extensions,
    loading,
    error,
    isAuthenticated,
    requiresPasswordChange,
    setRequiresPasswordChange,
    login,
    register,
    logout,
    fetchUser,
    clearError,
    hasRole,
    can,
    canAny,
    canAll,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
